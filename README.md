# Solana Indexer Backend

Backend service for indexing Solana blockchain data through Helius webhooks.

## Features

- Helius webhook integration
- Robust database integration with Sequelize ORM
- Support for different asset types (NFTs, tokens, etc.)
- Queue-based processing with BullMQ for high scalability

## Webhook Processing

The system now uses BullMQ for asynchronous processing of webhooks:

1. Webhook requests are received via the `/api/webhooks/log` endpoint
2. Requests are queued in Redis using BullMQ
3. Worker processes consume the queued jobs asynchronously
4. Results are stored in the database

This approach allows the system to handle high volumes of webhook traffic efficiently, with built-in retry mechanisms and failure handling.

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- Redis (for BullMQ)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start Redis (if using BullMQ):
   ```
   npm run start:redis
   ```
5. Start the application:
   ```
   npm run dev
   ```

### Testing Webhooks

You can test the webhook processing with:

```
npm run test:webhook
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:cron` - Test cron jobs
- `npm run test:webhook` - Test webhook processing
- `npm run start:redis` - Start Redis using Docker

## Documentation

For more detailed information about the BullMQ implementation, see [README-BULLMQ.md](./README-BULLMQ.md).
