import express, { Router } from "express";
import healthRoutes from "./health.routes";
import webhooksRoutes from "./webhooks.route";
import jobsRoutes from "./jobs.route";

const router: Router = express.Router();

router.use("/health", healthRoutes);
router.use("/jobs", jobsRoutes);
router.use("/webhooks", webhooksRoutes);

export default router;
