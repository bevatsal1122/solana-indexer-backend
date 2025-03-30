# Solana Indexer Backend

A high-performance scalable backend service for indexing Solana blockchain events, processing webhooks, and managing job subscriptions. This service uses BullMQ with Redis for efficient asynchronous processing and Redis caching for optimized performance. It uses Helius webhooks to recieve updates for latest blockchain events.

## Features

- **Webhook Processing**: Handle NFT mint, sale, listing, and other Solana blockchain events
- **Job Subscription Management**: Create and manage webhook subscription jobs
- **Queue-based Architecture**: Leverages BullMQ for reliable asynchronous processing
- **Redis Caching**: Optimizes job lookups with intelligent caching
- **Horizontal Scaling**: Designed to scale across multiple instances

## Tech Stack

- **Node.js & TypeScript**: Core runtime and language
- **Express**: Web framework
- **BullMQ**: Queue management for asynchronous processing
- **Redis**: For queue management and caching
- **Supabase**: Database and authentication
- **Helius SDK**: For interacting with Solana blockchain data

## Prerequisites

- Node.js (v16+)
- Redis server (local or cloud)
- Supabase account
- Helius API key

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/bevatsal1122/solana-indexer-backend.git
cd solana-indexer-backend
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment Variables

Create a `.env` file in the root directory using the provided `.env.example` as a template:

```bash
cp .env.example .env
```

Update the `.env` file with your actual credentials:

- Supabase URL and key
- Redis connection details
- Helius API key
- Other configuration options

### Redis Setup

The application requires Redis for BullMQ and caching. You can:

1. **Use a local Redis instance**:

   ```bash
   # Install Redis (MacOS)
   brew install redis

   # Start Redis server
   brew services start redis
   ```

2. **Install Docker**:

   Download the [docker.dmg](https://www.docker.com/products/docker-desktop/) file from their official website and install it locally.


3. **Run this command**:
   ```bash
   npm run start:redis
   ```

### Running the Application

1. **Run this command**:
   ```bash
   npm run dev
   ```
2. **Call GET**:
   ```bash
   http://localhost:4000/webhooks/create
   ```

## API Endpoints

- **GET /health**: Check service health status
- **GET /api/jobs**: List all job subscriptions
- **POST /api/jobs**: Create a new job subscription
- **PUT /api/jobs/:id**: Update a job subscription
- **DELETE /api/jobs/:id**: Delete a job subscription
- **POST /api/webhooks/log**: Process webhooks from Helius

## BullMQ Configuration

BullMQ is used for asynchronous webhook processing. When enabled:

1. Incoming webhooks are added to appropriate queues
2. Worker processes handle these jobs independently
3. Failed jobs are automatically retried with backoff

To disable BullMQ and use synchronous processing, set `ENABLE_BULL_MQ=false` in your `.env`.

For more details, see [README-BULLMQ.md](README-BULLMQ.md).

## Redis Caching

Redis caching is used to optimize job subscription lookups:

1. Active job subscriptions are cached by job type
2. Cache has a configurable TTL (default: 1 hour)
3. Cache is refreshed when jobs are accessed
4. Cache is updated when job statuses change

## Environment Variables

Create a `.env` file with the following variables:

```

PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Set to false to disable BullMQ and use synchronous processing

ENABLE_BULL_MQ=true

# Redis Configuration (for BullMQ and caching)

REDIS_URL=your_redis_url
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

# Helius API Key for Solana data

HELIUS_API_KEY=your_helius_api_key

# Webhook Authentication

WEBHOOK_AUTHORIZATION=your_webhook_auth_token

```

## License

[MIT](LICENSE)
```
