import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Import routes
import apiRoutes from "./routes/index";

// Import cron jobs
import { initCronJobs } from "./cron";

// Import webhook workers
import { initializeWorkers } from "./workers/webhookWorker";
import { ENABLE_BULL_MQ } from "./lib/queue";

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/", apiRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Solana Indexer Backend",
    version: "1.0.0",
    queueMode: ENABLE_BULL_MQ ? "enabled" : "disabled"
  });
});

// Add health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    queueMode: ENABLE_BULL_MQ ? "enabled" : "disabled",
    env: process.env.NODE_ENV || "development"
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Initialize cron jobs
initCronJobs();

// Initialize webhook workers if BullMQ is enabled
try {
  const workers = initializeWorkers();
  if (workers) {
    console.log("🚀 BullMQ workers initialized successfully");
  } else {
    console.log("⚠️ Running in synchronous mode - Redis not available");
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server and workers');
    
    // Close all workers if they exist
    if (workers) {
      for (const worker of Object.values(workers)) {
        await worker.close();
      }
    }
    
    process.exit(0);
  });
} catch (error) {
  console.error("Failed to initialize workers:", error);
  console.log("⚠️ Running in synchronous mode due to initialization error");
}

// Start server
app.listen(port, () => {
  console.log(`⚡️ Server is running at http://localhost:${port}`);
});
