# Redis Cache Implementation in Solana Indexer Backend

This document describes how Redis caching is implemented in the Solana Indexer Backend for optimizing job subscription lookups during webhook processing.

## Overview

The Solana Indexer Backend now uses Redis caching to speed up webhook processing by:

1. Caching active job subscriptions by job type (NFT mint, NFT sale, etc.)
2. Checking the cache first before querying the database
3. Maintaining TTL (Time To Live) for cached items
4. Automatically refreshing the cache when jobs are processed
5. Adding and removing jobs from the cache when their status changes

## Key Components

### 1. Redis Cache Service (`src/lib/redis-cache.ts`)

- **Core Functionality**:
  - Store and retrieve job subscriptions by job type
  - Manage TTL for cached items (default: 1 hour)
  - Add and remove jobs from cache
  - Refresh TTL for frequently accessed jobs

- **Key Functions**:
  - `getCachedJobsByType(jobType)`: Retrieves jobs from cache by type
  - `cacheJobsByType(jobType, jobs, ttl)`: Caches multiple jobs
  - `addJobToCache(jobType, job, ttl)`: Adds a single job to cache
  - `removeJobFromCache(jobType, jobId)`: Removes a job from cache
  - `refreshJobCacheTTL(jobType, ttl)`: Extends the TTL for cached jobs

### 2. Webhook Processing (`src/routes/webhooks.route.ts`)

- **Caching Flow**:
  1. When a webhook is received, first check Redis cache for subscribed jobs
  2. If jobs are found in cache, use them and refresh their TTL
  3. If no jobs in cache, query the database and populate the cache
  4. After processing cached jobs, check for new jobs in the database that aren't in cache
  5. Add any newly discovered jobs to the cache

### 3. Job Management (`src/routes/jobs.route.ts`)

- **Cache Maintenance**:
  - When a job starts running, add it to the Redis cache
  - When a job stops or fails, remove it from the Redis cache

### 4. Workers (`src/workers/webhookWorker.ts`)

- **TTL Management**:
  - Refresh cache TTL after successfully processing a webhook
  - Maintain cache TTL in both synchronous and queue-based processing modes

## Benefits

1. **Reduced Database Load**: Minimizes database queries for frequently accessed job subscriptions
2. **Improved Response Time**: Faster webhook processing by avoiding database lookups
3. **Better Scalability**: Enables handling higher webhook volumes with minimal infrastructure
4. **Resilience**: Falls back to database if cache is unavailable or expired

## Cache Configuration

The default TTL for cached items is 1 hour (3600 seconds). This can be adjusted in `src/lib/redis-cache.ts` by changing the `DEFAULT_TTL` constant.

## Cache Key Structure

Cache keys follow this pattern: `job_subscriptions:{job_type}`

Examples:
- `job_subscriptions:nft_mint`
- `job_subscriptions:nft_sale`
- `job_subscriptions:nft_listing`

## Fallback Behavior

If Redis is unavailable or a cache operation fails:
1. The system gracefully falls back to using the database
2. Non-critical cache errors are logged but don't interrupt processing
3. The application continues to function normally, just without the performance benefits of caching

## Monitoring

The cache status can be monitored via the `/health` endpoint, which now includes a `cacheStatus` field indicating whether Redis caching is active.

## Scalability Considerations

This Redis cache implementation works well in a horizontally scaled environment:

- Multiple instances of the application can share the same Redis cache
- TTL refreshing ensures frequently accessed jobs stay in cache
- Cache invalidation happens automatically through TTL expiration
- Manual cache management occurs when job status changes 