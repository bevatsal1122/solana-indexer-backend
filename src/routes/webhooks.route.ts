import express, { Router, Request, Response } from "express";
import {
  TransactionType,
  WebhookType,
  Address,
  TxnStatus,
  Helius,
} from "helius-sdk";
import supabase from "../lib/supabase";
import { Sequelize } from "sequelize";
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

const helius = new Helius("fdfd8c30-b1fd-4121-adec-94623d6ba124");

const router: Router = express.Router();

// POST /webhooks/log
router.post("/log", async (req: Request, res: Response) => {
  const webhookData = req.body[0];
  const headers = req.headers;
  console.dir(webhookData, { depth: null });
  console.dir(headers, { depth: null });

  if (!webhookData) {
    console.error("No webhook data provided");
    return res.status(400).json({
      status: "error",
      message: "No webhook data provided",
    });
  }

  console.log("Processing webhook data...");

  try {
    const transactionType = webhookData.type;
    let jobType;

    if (
      transactionType.toLowerCase() === "compressed_nft_mint" ||
      transactionType.toLowerCase() === "nft_mint" ||
      transactionType.toLowerCase() === "nft_listing" ||
      transactionType.toLowerCase() === "nft_sale"
    ) {
      jobType = transactionType.toLowerCase();
    } else {
      return res.status(400).json({
        status: "error",
        message: "Unsupported transaction type",
        type: transactionType,
      });
    }

    const { data: jobs, error } = await supabase
      .from("indexer_jobs")
      .select("*")
      .eq("type", jobType.toUpperCase())
      .eq("status", "running");

    if (error) {
      console.error("Error fetching jobs:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch jobs",
        error: error.message,
      });
    }

    if (!jobs || jobs.length === 0) {
      console.log(`No active jobs found for type: ${jobType}`);
      return res.status(200).json({
        status: "ok",
        message: "No active jobs found for this transaction type",
        transactionType,
      });
    }

    const results = await Promise.all(
      jobs.map(async (job) => {
        try {
          // Create database connection string
          const connectionString = `postgres://${
            job.db_user
          }:${encodeURIComponent(job.db_password)}@${job.db_host}:${
            job.db_port
          }/${job.db_name}`;

          const sequelize = new Sequelize(connectionString, {
            dialect: "postgres",
            logging: false,
            dialectOptions: {
              connectTimeout: 30000,
            },
          });

          await sequelize.authenticate();
          console.log(`Connected to database for job ID: ${job.id}`);

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

          // Update entry count in the job
          await supabase
            .from("indexer_jobs")
            .update({
              entries_processed: job.entries_processed + 1,
              last_updated: new Date().toISOString(),
            })
            .eq("id", job.id);

          await supabase.from("logs").insert({
            job_id: job.id,
            message: `Successfully processed ${transactionType} with signature: ${
              webhookData.signature || "N/A"
            }`,
            tag: "INFO",
          });

          await sequelize.close();

          return {
            jobId: job.id,
            status: "success",
            recordId: createdRecord.id,
          };
        } catch (err: any) {
          console.error(`Error processing job ${job.id}:`, err);

          // Log error
          await supabase.from("logs").insert({
            job_id: job.id,
            message: `Error processing ${transactionType}: ${
              err.message || "Unknown error"
            }`,
            tag: "ERROR",
          });

          return {
            jobId: job.id,
            status: "error",
            error: err.message || "Unknown error",
          };
        }
      })
    );

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      webhookType: transactionType,
      processedJobs: results.length,
      results,
    });
  } catch (err: any) {
    console.error("Error in webhook processing:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to process webhook",
      error: err.message || "Unknown error",
    });
  }
});

// Just for admin purpose and testing
router.post("/create", (req: Request, res: Response) => {
  helius.createWebhook({
    accountAddresses: ["metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"],
    authHeader: "bevats15",
    webhookURL: "https://solana-indexer-backend.onrender.com/api/webhooks",
    webhookType: WebhookType.RAW_DEVNET,
    transactionTypes: [
      TransactionType.NFT_BID,
      TransactionType.NFT_SALE,
      TransactionType.NFT_MINT,
    ],
    txnStatus: TxnStatus.SUCCESS,
  });

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
