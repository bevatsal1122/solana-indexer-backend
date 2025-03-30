import express, { Router, Request, Response } from "express";
import supabase from "../lib/supabase";
import { Sequelize, DataTypes } from "sequelize";
import {
  NFTMint,
  NFTSale,
  NFTListing,
  CompressedMintNFT,
  initializeModels,
} from "../models";
import { addJobToCache, removeJobFromCache } from "../lib/redis-cache";

const jobRouter: Router = express.Router();

// POST /jobs/create
jobRouter.post("/create", async (req: Request, res: Response) => {
  const { jobId } = req.body;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("Processing job:", jobId);

  const job = await supabase
    .from("indexer_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job || !job.data) {
    res.status(404).json({
      status: "error",
      message: "Job not found",
    });
    return;
  }

  const { db_host, db_name, db_password, db_port, db_user } = job.data;

  const connectionString = `postgres://${db_user}:${encodeURIComponent(
    db_password
  )}@${db_host}:${db_port}/${db_name}`;

  try {
    const sequelize = new Sequelize(connectionString, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        connectTimeout: 30000,
      },
    });

    await sequelize.authenticate();
    console.log(
      "Database connection has been established successfully for job:",
      jobId
    );

    initializeModels(sequelize);

    const jobType = job.data.type;

    let IndexerData: any;

    if (jobType.toLowerCase() === "nft_mint") {
      IndexerData = NFTMint;
    } else if (jobType.toLowerCase() === "nft_sale") {
      IndexerData = NFTSale;
    } else if (jobType.toLowerCase() === "nft_listing") {
      IndexerData = NFTListing;
    } else if (jobType.toLowerCase() === "compressed_nft_mint") {
      IndexerData = CompressedMintNFT;
    } else {
      await sequelize.close();

      throw new Error("Invalid job type");
    }

    const result = await IndexerData.sync({ force: false });
    console.log("IndexerData table created successfully", result);

    await sequelize.close();

    const { data, error } = await supabase
      .from("indexer_jobs")
      .update({
        status: "running",
      })
      .eq("id", jobId);

    const { data: jobStartLog, error: jobError } = await supabase
      .from("logs")
      .insert({
        job_id: jobId,
        message:
          "Database connection successful and table created and job started successfully",
        tag: "INFO",
      });
    if (error || jobError) {
      res.status(500).json({
        status: "error",
        message: "Failed to update job status",
      });
      return;
    }

    const jobTypeForCache = jobType.toLowerCase();
    try {
      await addJobToCache(jobTypeForCache, job.data);
      console.log(
        `Added job ${jobId} to Redis cache for type ${jobTypeForCache}`
      );
    } catch (cacheError) {
      console.error(`Error adding job to cache: ${cacheError}`);
    }

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db_connected: true,
      table_created: true,
    });
  } catch (err: any) {
    console.error("Database connection error:", err);

    let errorMessage = "Unable to connect to the database";
    if (err.parent && err.parent.code === "ENOTFOUND") {
      errorMessage = `Database host not found. Please check the hostname is correct`;
    } else if (err.parent && err.parent.code === "ETIMEDOUT") {
      errorMessage =
        "Connection to database timed out. Please check firewall settings or network connection";
    } else if (err.parent && err.parent.code === "ECONNREFUSED") {
      errorMessage = `Connection to database at ${db_host}:${db_port} was refused. Please check the port is open and the service is running`;
    } else if (err.message === "Invalid job type") {
      errorMessage = "Invalid job type";
    }

    const { data, error } = await supabase
      .from("indexer_jobs")
      .update({
        status: "failed",
      })
      .eq("id", jobId);

    const { data: jobErrorLog, error: jobErrorLogError } = await supabase
      .from("logs")
      .insert({
        job_id: jobId,
        message: errorMessage,
        tag: "ERROR",
      });

    if (jobErrorLogError) {
      console.error("Failed to log job error:", jobErrorLogError);
    }

    res.status(500).json({
      status: "error",
      message: errorMessage,
      error: err.message,
    });
  }
});

// POST /jobs/stop
jobRouter.post("/stop", async (req: Request, res: Response) => {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({
      status: "error",
      message: "Job ID is required",
    });
  }

  try {
    const { data: job, error: fetchError } = await supabase
      .from("indexer_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return res.status(404).json({
        status: "error",
        message: "Job not found",
      });
    }

    if (job.type) {
      const jobType = job.type.toLowerCase();
      try {
        await removeJobFromCache(jobType, jobId);
        console.log(
          `Removed job ${jobId} from Redis cache for type ${jobType}`
        );
      } catch (cacheError) {
        console.error(`Error removing job from cache: ${cacheError}`);
      }
    }

    return res.status(200).json({
      status: "ok",
      message: "Job stopped successfully",
    });
  } catch (err: any) {
    console.error("Error stopping job:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to stop job",
      error: err.message,
    });
  }
});

export default jobRouter;
