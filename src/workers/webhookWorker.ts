import { Worker, Job } from "bullmq";
import { Sequelize } from "sequelize";
import supabase from "../lib/supabase";
import {
  NFTMint,
  NFTSale,
  NFTListing,
  CompressedMintNFT,
  initializeModels,
} from "../models";
import {
  formatNFTSaleData,
  formatNFTMintData,
  formatNFTListingData,
  formatCompressedMintNFTData,
} from "../lib/formatters";
import { redisConnection, ENABLE_BULL_MQ } from "../lib/queue";
import { refreshJobCacheTTL } from "../lib/redis-cache";

export async function processWebhookDataSync(
  webhookData: any,
  jobInfo: any,
  jobType: string
): Promise<any> {
  try {
    const connectionString = `postgres://${
      jobInfo.db_user
    }:${encodeURIComponent(jobInfo.db_password)}@${jobInfo.db_host}:${
      jobInfo.db_port
    }/${jobInfo.db_name}`;

    const sequelize = new Sequelize(connectionString, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        connectTimeout: 30000,
      },
    });

    await sequelize.authenticate();
    console.log(`Connected to database for job ID: ${jobInfo.id}`);

    initializeModels(sequelize);

    let IndexerData: any;
    let formattedData: any;

    if (jobType === "nft_mint") {
      IndexerData = NFTMint;
      formattedData = formatNFTMintData(webhookData);
    } else if (jobType === "nft_sale") {
      IndexerData = NFTSale;
      formattedData = formatNFTSaleData(webhookData);
    } else if (jobType === "nft_listing") {
      IndexerData = NFTListing;
      formattedData = formatNFTListingData(webhookData);
    } else if (jobType === "compressed_nft_mint") {
      IndexerData = CompressedMintNFT;
      formattedData = formatCompressedMintNFTData(webhookData);
    } else {
      throw new Error("Invalid job type");
    }

    await IndexerData.sync({ force: false });

    const createdRecord = await IndexerData.create(formattedData);

    await supabase
      .from("indexer_jobs")
      .update({
        entries_processed: jobInfo.entries_processed + 1,
        last_updated: new Date().toISOString(),
      })
      .eq("id", jobInfo.id);

    await supabase.from("logs").insert({
      job_id: jobInfo.id,
      message: `Successfully processed ${jobType} with signature: ${
        webhookData.signature || "N/A"
      }`,
      tag: "INFO",
    });

    try {
      await refreshJobCacheTTL(jobType);
    } catch (cacheError) {
      console.error(`Error refreshing cache TTL: ${cacheError}`);
    }

    await sequelize.close();

    return {
      jobId: jobInfo.id,
      status: "success",
      recordId: createdRecord.id,
    };
  } catch (err: any) {
    console.error(`Error processing job ${jobInfo.id}:`, err);

    await supabase.from("logs").insert({
      job_id: jobInfo.id,
      message: `Error processing ${jobType}: ${err.message || "Unknown error"}`,
      tag: "ERROR",
    });

    throw err;
  }
}

export async function processWebhookData(
  job: Job<any, any, string>
): Promise<any> {
  const { webhookData, jobInfo } = job.data;
  const jobType = job.name.toLowerCase();

  const result = await processWebhookDataSync(webhookData, jobInfo, jobType);

  try {
    await refreshJobCacheTTL(jobType);
  } catch (error) {
    console.error(`Error refreshing cache TTL in queue worker: ${error}`);
  }

  return result;
}

export function initializeWorkers() {
  if (!ENABLE_BULL_MQ || !redisConnection) {
    console.warn(
      "BullMQ workers initialization skipped - Redis not available"
    );
    return null;
  }

  try {
    const workerOptions = {
      connection: redisConnection,
      concurrency: 25,
    };

    const nftMintWorker = new Worker(
      "nft-mint-queue",
      processWebhookData,
      workerOptions
    );

    const nftSaleWorker = new Worker(
      "nft-sale-queue",
      processWebhookData,
      workerOptions
    );

    const nftListingWorker = new Worker(
      "nft-listing-queue",
      processWebhookData,
      workerOptions
    );

    const compressedNftMintWorker = new Worker(
      "compressed-nft-mint-queue",
      processWebhookData,
      workerOptions
    );

    [
      nftMintWorker,
      nftSaleWorker,
      nftListingWorker,
      compressedNftMintWorker,
    ].forEach((worker) => {
      worker.on("completed", (job) => {
        console.log(`Job ${job.id} completed for queue ${job.queueName}`);
      });

      worker.on("failed", (job, err) => {
        console.error(
          `Job ${job?.id} failed for queue ${job?.queueName}:`,
          err
        );
      });
    });

    console.log("✅ BullMQ workers initialized successfully");

    return {
      nftMintWorker,
      nftSaleWorker,
      nftListingWorker,
      compressedNftMintWorker,
    };
  } catch (error) {
    console.error("Failed to initialize BullMQ workers:", error);
    console.warn(
      "Workers initialization failed - falling back to synchronous processing"
    );
    return null;
  }
}
