# BullMQ Implementation for Solana Indexer Backend

This document describes the BullMQ implementation for the Solana Indexer Backend, which optimizes webhook processing by using a queue system.

## Overview

The Solana Indexer Backend now uses BullMQ to handle webhook processing in a scalable and resilient way. Instead of processing webhooks synchronously during the HTTP request, webhooks are now added to queues and processed asynchronously by worker processes.

## ⚠️ Important: Redis Requirement

**Redis is required for this implementation to work.**

BullMQ depends on Redis for queue management. You must install and run Redis before starting the application, or the application will fail to start properly.

## Key Components

1. **Queues** (`src/lib/queue.ts`):
   - Separate queues for each webhook type: NFT Mint, NFT Sale, NFT Listing, and Compressed NFT Mint
   - Redis-based queue persistence
   - Configurable retry mechanism for failed jobs

2. **Workers** (`src/workers/webhookWorker.ts`):
   - Process jobs from their respective queues
   - Database operations are executed within worker processes
   - Error handling and retry logic

3. **Webhook Route** (`src/routes/webhooks.route.ts`):
   - Receives webhook requests
   - Adds jobs to the appropriate queue
   - Returns immediately with a "queued" status

## Setup Requirements

### Redis Installation

BullMQ requires Redis for queue management. You can run Redis:

1. Locally:
   ```bash
   # Install Redis (MacOS)
   brew install redis
   
   # Start Redis server
   brew services start redis
   ```

2. Using Docker:
   ```bash
   docker run --name redis -p 6379:6379 -d redis
   ```

3. Using a cloud service like Redis Labs, AWS ElastiCache, etc.

### Environment Variables

Configure Redis connection in your `.env` file:

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for no password
```

## Fallback Mode

If you need to run the application without Redis temporarily, you can modify the code to use a direct processing mode instead of queues. This is not recommended for production but can be helpful during development or when Redis is not available.

## Scaling

To handle high loads:

1. **Horizontal Scaling**: You can run multiple instances of the application. Each instance will start worker processes that consume from the same Redis-based queues.

2. **Worker Concurrency**: Adjust the `concurrency` setting in `initializeWorkers()` function to process more jobs in parallel per worker.

## Error Handling and Monitoring

- Failed jobs are automatically retried based on the configured backoff strategy
- Jobs that fail repeatedly are stored for later inspection
- Use Redis monitoring tools like Redis Commander or RedisInsight to inspect queues

## Testing

To test the queue implementation:

1. Install and start Redis
2. Start the application: `npm run dev`
3. Send a webhook to the `/api/webhooks/log` endpoint
4. Check logs to ensure job is queued and processed by workers

## Troubleshooting

- If jobs are not being processed, check Redis connection
- Verify that worker processes are running (look for "BullMQ workers initialized successfully" in logs)
- Check for errors in the worker logs 