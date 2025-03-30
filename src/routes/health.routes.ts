import express, { Router, Request, Response } from "express";
import { ENABLE_BULL_MQ, redisConnection } from "../lib/queue";

const router: Router = express.Router();

// GET /health
router.get("/", (req: Request, res: Response) => {
  
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    queueMode: ENABLE_BULL_MQ ? "enabled" : "disabled",
    cacheStatus: redisConnection ? "connected" : "disabled",
    env: process.env.NODE_ENV || "development"
  });
});

export default router;
