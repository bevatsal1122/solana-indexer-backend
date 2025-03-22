import express, { Router } from "express";
import healthRoutes from "./health.routes";

const router: Router = express.Router();

// Health check routes
router.use("/health", healthRoutes);

export default router;
