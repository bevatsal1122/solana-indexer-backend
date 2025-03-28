import express, { Router } from "express";
import healthRoutes from "./health.routes";
import webhooksRoutes from "./webhooks.route";

const router: Router = express.Router();

// Health check routes
router.use("/health", healthRoutes);
router.use("/webhooks", webhooksRoutes);

export default router;
