import express, { Router, Request, Response } from "express";
import { TransactionType, WebhookType, TxnStatus, Helius } from "helius-sdk";
import supabase from "../lib/supabase";
import { getQueueForJobType, ENABLE_BULL_MQ } from "../lib/queue";
import { processWebhookDataSync } from "../workers/webhookWorker";
import {
  getCachedJobsByType,
  cacheJobsByType,
  refreshJobCacheTTL,
  addJobToCache,
} from "../lib/redis-cache";

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
    let jobs = await getCachedJobsByType(jobType);
    let cachingEnabled = !!jobs;

    if (!jobs) {
      console.log(
        `No cached jobs found for type: ${jobType}, fetching from database...`
      );
      jobs = [];
    } else {
      console.log(`Found ${jobs.length} cached jobs for type: ${jobType}`);
      cachingEnabled = true;
    }

    console.log(`Querying Supabase for latest jobs of type: ${jobType}`);
    const { data: dbJobs, error } = await supabase
      .from("indexer_jobs")
      .select("*")
      .eq("type", jobType.toUpperCase())
      .eq("status", "running");

    if (error) {
      console.error("Error fetching jobs from Supabase:", error);

      if (!jobs || jobs.length === 0) {
        console.log(
          `No active jobs found for type: ${jobType} (DB fetch error)`
        );
        return res.status(200).json({
          status: "ok",
          message: "No active jobs found for this transaction type",
          transactionType,
        });
      }
    } else if (dbJobs) {
      // Compare database jobs with cached jobs to find differences
      const cachedJobIds = jobs.map((job) => job.id);
      const newJobs = dbJobs.filter((job) => !cachedJobIds.includes(job.id));

      if (newJobs.length > 0) {
        console.log(
          `Found ${newJobs.length} new jobs from Supabase not in cache`
        );
        jobs = [...jobs, ...newJobs];
      }

      if (cachingEnabled && dbJobs.length > 0) {
        await cacheJobsByType(jobType, dbJobs);
      } else if (dbJobs.length > 0) {
        await cacheJobsByType(jobType, dbJobs);
        cachingEnabled = true;
      }
    }

    if (!jobs || jobs.length === 0) {
      console.log(`No active jobs found for type: ${jobType}`);
      return res.status(200).json({
        status: "ok",
        message: "No active jobs found for this transaction type",
        transactionType,
      });
    }

    const queue = getQueueForJobType(jobType);

    let results;

    if (ENABLE_BULL_MQ && queue) {
      // Use queue-based processing if BullMQ is available
      const jobPromises = jobs.map(async (job) => {
        try {
          // Add the job to the queue with the webhook data and job info
          const queueJob = await queue.add(
            jobType,
            {
              webhookData,
              jobInfo: job,
            },
            {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
            }
          );

          // Log that we've queued the job
          await supabase.from("logs").insert({
            job_id: job.id,
            message: `Queued ${transactionType} for processing with signature: ${
              webhookData.signature || "N/A"
            }`,
            tag: "INFO",
          });

          // If we're using cache, refresh the TTL
          if (cachingEnabled) {
            await refreshJobCacheTTL(jobType);
          }

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

      // After processing the cached jobs, check if there are new jobs in the database
      // that aren't in the cache yet (e.g., recently added jobs)
      if (cachingEnabled) {
        const { data: allJobs, error } = await supabase
          .from("indexer_jobs")
          .select("*")
          .eq("type", jobType.toUpperCase())
          .eq("status", "running");

        if (!error && allJobs) {
          // Find jobs that weren't in the cache
          const cachedJobIds = jobs.map((job) => job.id);
          const newJobs = allJobs.filter(
            (job) => !cachedJobIds.includes(job.id)
          );

          // Process any new jobs and add them to the cache individually
          if (newJobs.length > 0) {
            console.log(
              `Found ${newJobs.length} new jobs not in cache for type: ${jobType}`
            );

            const newJobPromises = newJobs.map(async (job) => {
              try {
                // Add the job to the queue
                const queueJob = await queue.add(
                  jobType,
                  {
                    webhookData,
                    jobInfo: job,
                  },
                  {
                    attempts: 3,
                    backoff: {
                      type: "exponential",
                      delay: 1000,
                    },
                  }
                );

                // Add this job to the Redis cache
                await addJobToCache(jobType, job);

                // Log that we've queued the job
                await supabase.from("logs").insert({
                  job_id: job.id,
                  message: `Queued ${transactionType} for processing with signature: ${
                    webhookData.signature || "N/A"
                  } (new job found)`,
                  tag: "INFO",
                });

                return {
                  jobId: job.id,
                  status: "queued",
                  queueJobId: queueJob.id,
                  newlyAdded: true,
                };
              } catch (err: any) {
                console.error(`Error queueing new job ${job.id}:`, err);
                return {
                  jobId: job.id,
                  status: "error",
                  error: err.message || "Unknown error",
                  newlyAdded: true,
                };
              }
            });

            const newResults = await Promise.all(newJobPromises);
            results = [...results, ...newResults];
          }
        }
      }

      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        webhookType: transactionType,
        processingMode: "async-queue",
        cacheUsed: cachingEnabled,
        queuedJobs: results.length,
        results,
      });
    } else {
      // Fallback
      console.log("Using synchronous processing (Redis/BullMQ not available)");

      const jobPromises = jobs.map(async (job) => {
        try {
          const result = await processWebhookDataSync(
            webhookData,
            job,
            jobType
          );
          if (cachingEnabled) {
            await refreshJobCacheTTL(jobType);
          }
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

      if (cachingEnabled) {
        const { data: allJobs, error } = await supabase
          .from("indexer_jobs")
          .select("*")
          .eq("type", jobType.toUpperCase())
          .eq("status", "running");

        if (!error && allJobs) {
          const cachedJobIds = jobs.map((job) => job.id);
          const newJobs = allJobs.filter(
            (job) => !cachedJobIds.includes(job.id)
          );

          if (newJobs.length > 0) {
            console.log(
              `Found ${newJobs.length} new jobs not in cache for type: ${jobType}`
            );

            const newJobPromises = newJobs.map(async (job) => {
              try {
                const result = await processWebhookDataSync(
                  webhookData,
                  job,
                  jobType
                );
                await addJobToCache(jobType, job);
                return {
                  ...result,
                  newlyAdded: true,
                };
              } catch (err: any) {
                console.error(`Error processing new job ${job.id}:`, err);
                return {
                  jobId: job.id,
                  status: "error",
                  error: err.message || "Unknown error",
                  newlyAdded: true,
                };
              }
            });

            const newResults = await Promise.all(newJobPromises);
            results = [...results, ...newResults];
          }
        }
      }

      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        webhookType: transactionType,
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
