import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

export const ENABLE_BULL_MQ = process.env.ENABLE_BULL_MQ !== 'false';

let redisConnection: Redis | null = null;

try {
  if (ENABLE_BULL_MQ) {
    redisConnection = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      connectTimeout: 10000,
      tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    });

    redisConnection.on('error', (err) => {
      console.error('Redis connection error:', err);
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Redis connection failed - BullMQ will be disabled');
        process.env.ENABLE_BULL_MQ = 'false';
      } else {
        console.warn('⚠️ Redis connection error in production - will attempt to reconnect');
      }
    });

    redisConnection.on('connect', () => {
      console.log('✅ Redis connection established');
    });
  }
} catch (error) {
  console.error('Failed to initialize Redis connection:', error);
  console.warn('⚠️ Redis initialization failed - BullMQ will be disabled');
  process.env.ENABLE_BULL_MQ = 'false';
}

export { redisConnection };

export let nftMintQueue: Queue | null = null;
export let nftSaleQueue: Queue | null = null;
export let nftListingQueue: Queue | null = null;
export let compressedNftMintQueue: Queue | null = null;

if (ENABLE_BULL_MQ && redisConnection) {
  try {
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
  } catch (error) {
    console.error('Failed to initialize BullMQ queues:', error);
    console.warn('⚠️ Queue initialization failed - BullMQ will be disabled');
    process.env.ENABLE_BULL_MQ = 'false';
  }
} else {
  console.warn('⚠️ BullMQ is disabled - webhook processing will be synchronous');
}

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