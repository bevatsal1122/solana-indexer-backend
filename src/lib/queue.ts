import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_URL = process.env.REDIS_URL || '';

export const ENABLE_BULL_MQ = process.env.ENABLE_BULL_MQ !== 'false';

let redisConnection: Redis | null = null;

const tryConnect = async (config: any, description: string): Promise<Redis | null> => {
  try {
    console.log(`Attempting to connect to Redis with ${description}`);
    const client = new Redis(config);
    
    // Test connection with timeout
    const connectPromise = new Promise<Redis>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout for ${description}`));
      }, 5000);
      
      client.on('connect', () => {
        clearTimeout(timeout);
        console.log(`✅ Redis connection successful with ${description}`);
        resolve(client);
      });
      
      client.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`❌ Redis connection failed with ${description}:`, err);
        reject(err);
      });
    });
    
    return await connectPromise;
  } catch (error) {
    console.error(`Failed to connect with ${description}:`, error);
    return null;
  }
};

const initializeRedis = async () => {
  if (!ENABLE_BULL_MQ) {
    console.log('BullMQ is disabled, skipping Redis connection');
    return null;
  }
  
  // First, try connecting with connection string if provided
  if (REDIS_URL) {
    try {
      const client = await tryConnect(REDIS_URL, "connection string");
      if (client) return client;
    } catch (error) {
      console.warn('Connection with REDIS_URL failed, will try other methods');
    }
  }
  
  // Try with TLS
  try {
    const tlsConfig = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      tls: {},
      connectTimeout: 10000,
    };
    
    const client = await tryConnect(tlsConfig, "TLS config");
    if (client) return client;
  } catch (error) {
    console.warn('TLS connection failed, trying without TLS');
  }
  
  // Try without TLS
  try {
    const nonTlsConfig = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      tls: undefined,
      connectTimeout: 10000,
    };
    
    const client = await tryConnect(nonTlsConfig, "non-TLS config");
    if (client) return client;
  } catch (error) {
    console.error('Both TLS and non-TLS connections failed');
  }
  
  return null;
};

// Initialize Redis connection
(async () => {
  try {
    redisConnection = await initializeRedis();
    
    if (redisConnection) {
      console.log('Redis connection established successfully');
      
      // Initialize queues
      const queueOptions: QueueOptions = {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      };
      
      nftMintQueue = new Queue('nft-mint-queue', queueOptions);
      nftSaleQueue = new Queue('nft-sale-queue', queueOptions);
      nftListingQueue = new Queue('nft-listing-queue', queueOptions);
      compressedNftMintQueue = new Queue('compressed-nft-mint-queue', queueOptions);
      console.log('✅ BullMQ queues initialized successfully');
    } else {
      console.warn('⚠️ Redis connection failed - BullMQ will be disabled');
      process.env.ENABLE_BULL_MQ = 'false';
    }
  } catch (error) {
    console.error('Failed to initialize Redis and queues:', error);
    process.env.ENABLE_BULL_MQ = 'false';
  }
})();

export { redisConnection };

export let nftMintQueue: Queue | null = null;
export let nftSaleQueue: Queue | null = null;
export let nftListingQueue: Queue | null = null;
export let compressedNftMintQueue: Queue | null = null;

export const getQueueForJobType = (jobType: string) => {
  if (!ENABLE_BULL_MQ || !redisConnection) {
    return null;
  }
  
  switch (jobType.toLowerCase()) {
    case 'nft_mint':
      return nftMintQueue;
    case 'nft_sale':
      return nftSaleQueue;
    case 'nft_listing':
      return nftListingQueue;
    case 'compressed_nft_mint':
      return compressedNftMintQueue;
    default:
      throw new Error(`Unsupported job type: ${jobType}`);
  }
}; 