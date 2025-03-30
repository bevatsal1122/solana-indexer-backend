# Redis Connection Troubleshooting

This guide helps you troubleshoot common Redis connection issues when using BullMQ in the Solana Indexer Backend.

## Common Error: maxRetriesPerRequest must be null

If you see this error:
```
Error: BullMQ: Your redis options maxRetriesPerRequest must be null
```

This happens because BullMQ requires specific Redis connection settings. To fix:

1. Make sure your Redis connection settings in `src/lib/queue.ts` use:
   ```javascript
   maxRetriesPerRequest: null
   ```

2. This parameter must be `null` (not a number or undefined) for BullMQ's blocking operations to work correctly.

## No Redis Connection

If BullMQ is disabled with message "Redis connection failed":

1. Check that Redis is running:
   ```bash
   # If using Docker
   docker ps | grep redis
   
   # If installed locally
   redis-cli ping
   ```

2. Verify your `.env` file has the correct Redis settings:
   ```
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ENABLE_BULL_MQ=true
   ```

3. Try starting Redis with our script:
   ```bash
   npm run start:redis
   ```

## Testing Redis Connection

To test if Redis is working correctly:

```bash
# Using redis-cli (if installed)
redis-cli -h localhost -p 6379 ping

# Using Docker
docker run --rm -it redis redis-cli -h host.docker.internal -p 6379 ping
```

You should get "PONG" as a response.

## Forcing Synchronous Mode

If you want to temporarily disable BullMQ and use synchronous processing:

1. Set in your `.env` file:
   ```
   ENABLE_BULL_MQ=false
   ```

2. Or when running your app:
   ```bash
   ENABLE_BULL_MQ=false npm run dev
   ```

## Checking Redis Logs

If you're using Docker, check Redis logs:

```bash
docker logs solana-indexer-redis
```

## Restart All Components

If you're still having issues:

1. Stop Redis:
   ```bash
   docker stop solana-indexer-redis
   docker rm solana-indexer-redis
   ```

2. Start Redis again:
   ```bash
   npm run start:redis
   ```

3. Restart your application:
   ```bash
   npm run dev
   ``` 