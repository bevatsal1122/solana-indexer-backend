# Deploying to Render with Redis

This guide helps you deploy the Solana Indexer Backend to Render with properly configured Redis for BullMQ.

## Redis Setup Options

### Option 1: Redis Cloud (Recommended)

1. Sign up at [Redis Cloud](https://redis.com/try-free/) 
2. Create a free database (30MB)
3. Get your connection details:
   - Endpoint URL
   - Port (usually 6379 or 12345)
   - Default user password
4. Copy the Redis URL in this format:
   ```
   redis://default:password@endpoint.cloud.redislabs.com:port
   ```

### Option 2: Upstash Redis

1. Sign up at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Get your connection string from the console
4. It will look like:
   ```
   redis://default:password@us1-capable-chicken-12345.upstash.io:12345
   ```

## Render Configuration

### 1. Setting Environment Variables

In the Render dashboard for your service:

1. Go to "Environment" tab
2. Add the following variables:
   ```
   NODE_ENV=production
   ENABLE_BULL_MQ=true
   REDIS_URL=your_full_redis_url
   ```

3. **Important**: Prefer using the full `REDIS_URL` rather than separate host/port/password settings.

### 2. Additional Configuration

Add these environment variables as needed:

```
# Your Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Helius API Key
HELIUS_API_KEY=your_helius_api_key

# Any other required settings
PORT=10000
```

## Troubleshooting Common Issues

### SSL/TLS Errors

If you see SSL errors like `wrong version number`:

1. **Double-check URL format**:
   - Ensure the URL has the correct protocol (`redis://` or `rediss://`)
   - For TLS connections, some providers require `rediss://` (note the double 's')

2. **Try using the direct URL from your Redis provider**:
   - Most providers give you a ready-to-use connection string
   - Copy and paste it exactly as shown

3. **Check Redis Cloud TLS requirements**:
   - Redis Cloud requires TLS for external connections
   - Make sure your URL uses the correct TLS-enabled port

### Connection Timeouts

If you see connection timeouts:

1. **Check network access**:
   - Ensure your Redis provider allows connections from Render
   - Some services require IP whitelisting

2. **Verify credentials**:
   - Double-check username/password
   - Some Redis services use "default" as the username

3. **Check Redis service status**:
   - Verify your Redis instance is active and running

## Verifying Redis Connection

After deployment, check if Redis is correctly connected:

1. View your service logs in Render dashboard
2. Look for the message: `✅ Redis connection successful with connection string`
3. And: `✅ BullMQ queues initialized successfully`

If these messages appear, your Redis connection is working properly.

## Fallback Mode

If Redis cannot be connected for any reason, the application will automatically fall back to synchronous processing mode. This ensures your service continues to work even if Redis is temporarily unavailable.

You'll see this message in the logs: `⚠️ Running in synchronous mode - Redis not available`

## Checking Queue Status

To monitor your queues, access the health endpoint:

```
https://your-app.onrender.com/health
```

This will show the current queue status and processing mode. 