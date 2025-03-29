import express, { Router, Request, Response } from "express";

const router: Router = express.Router();

// GET /health
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
