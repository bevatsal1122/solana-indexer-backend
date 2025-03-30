import express, { Router, Request, Response } from "express";
import {
  TransactionType,
  WebhookType,
  Address,
  TxnStatus,
  Helius,
} from "helius-sdk";
import supabase from "../lib/supabase";
import { getQueueForJobType, ENABLE_BULL_MQ } from "../lib/queue";
import { processWebhookDataSync } from "../workers/webhookWorker";

const helius = new Helius("fdfd8c30-b1fd-4121-adec-94623d6ba124");

const router: Router = express.Router();

// POST /webhooks/log
router.post("/log", async (req: Request, res: Response) => {
  const webhookData = req.body[0];
  const headers = req.headers;

  const webhookAuthorization = process.env.WEBHOOK_AUTHORIZATION;

  if (headers["authorization"] !== webhookAuthorization) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  }

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

    // Check if BullMQ is enabled and get the appropriate queue
    const queue = getQueueForJobType(jobType);
    
    let results;
    
    if (ENABLE_BULL_MQ && queue) {
      // Use queue-based processing if BullMQ is available
      const jobPromises = jobs.map(async (job) => {
        try {
          // Add the job to the queue with the webhook data and job info
          const queueJob = await queue.add(jobType, {
            webhookData,
            jobInfo: job
          }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          });

          // Log that we've queued the job
          await supabase.from("logs").insert({
            job_id: job.id,
            message: `Queued ${transactionType} for processing with signature: ${
              webhookData.signature || "N/A"
            }`,
            tag: "INFO",
          });

          return {
            jobId: job.id,
            status: "queued",
            queueJobId: queueJob.id,
          };
        } catch (err: any) {
          console.error(`Error queueing job ${job.id}:`, err);

          // Log error
          await supabase.from("logs").insert({
            job_id: job.id,
            message: `Error queueing ${transactionType}: ${
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
      });

      results = await Promise.all(jobPromises);
      
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        webhookType: transactionType,
        processingMode: "async-queue",
        queuedJobs: results.length,
        results,
      });
    } else {
      // Fallback to synchronous processing if BullMQ is not available
      console.log("Using synchronous processing (Redis/BullMQ not available)");
      
      const jobPromises = jobs.map(async (job) => {
        try {
          // Process the job directly (synchronously)
          const result = await processWebhookDataSync(webhookData, job, jobType);
          return result;
        } catch (err: any) {
          console.error(`Error processing job ${job.id}:`, err);
          return {
            jobId: job.id,
            status: "error",
            error: err.message || "Unknown error",
          };
        }
      });

      results = await Promise.all(jobPromises);
      
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        webhookType: transactionType,
        processingMode: "synchronous",
        processedJobs: results.length,
        results,
      });
    }
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
