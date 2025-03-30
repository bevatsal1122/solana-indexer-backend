import { Redis } from "ioredis";
import { redisConnection } from "./queue";

const DEFAULT_TTL = 3600;
const JOB_CACHE_PREFIX = "job_subscriptions:";

/**
 * Get jobs from Redis cache by job type
 * @param jobType The type of job (nft_mint, nft_sale, etc.)
 * @returns Array of cached jobs or null if not found
 */
export const getCachedJobsByType = async (
  jobType: string
): Promise<any[] | null> => {
  if (!redisConnection) {
    return null;
  }

  try {
    const cacheKey = `${JOB_CACHE_PREFIX}${jobType.toLowerCase()}`;
    const cachedData = await redisConnection.get(cacheKey);

    if (!cachedData) {
      return null;
    }

    console.log("Cached data:", JSON.parse(cachedData));

    return JSON.parse(cachedData);
  } catch (error) {
    console.error("Error retrieving cached jobs:", error);
    return null;
  }
};

/**
 * Cache jobs by job type with TTL
 * @param jobType The type of job (nft_mint, nft_sale, etc.)
 * @param jobs Array of jobs to cache
 * @param ttl TTL in seconds (defaults to 1 hour)
 */
export const cacheJobsByType = async (
  jobType: string,
  jobs: any[],
  ttl: number = DEFAULT_TTL
): Promise<boolean> => {
  if (!redisConnection) {
    return false;
  }

  try {
    const cacheKey = `${JOB_CACHE_PREFIX}${jobType.toLowerCase()}`;
    await redisConnection.set(cacheKey, JSON.stringify(jobs), "EX", ttl);
    return true;
  } catch (error) {
    console.error("Error caching jobs:", error);
    return false;
  }
};

/**
 * Refresh TTL for cached jobs
 * @param jobType The type of job (nft_mint, nft_sale, etc.)
 * @param ttl TTL in seconds (defaults to 1 hour)
 */
export const refreshJobCacheTTL = async (
  jobType: string,
  ttl: number = DEFAULT_TTL
): Promise<boolean> => {
  if (!redisConnection) {
    return false;
  }

  try {
    const cacheKey = `${JOB_CACHE_PREFIX}${jobType.toLowerCase()}`;
    const result = await redisConnection.expire(cacheKey, ttl);
    return result === 1;
  } catch (error) {
    console.error("Error refreshing job cache TTL:", error);
    return false;
  }
};

/**
 * Add a job to existing cache
 * @param jobType The type of job (nft_mint, nft_sale, etc.)
 * @param job The job to add to cache
 * @param ttl TTL in seconds (defaults to 1 hour)
 */
export const addJobToCache = async (
  jobType: string,
  job: any,
  ttl: number = DEFAULT_TTL
): Promise<boolean> => {
  if (!redisConnection) {
    return false;
  }

  try {
    const cacheKey = `${JOB_CACHE_PREFIX}${jobType.toLowerCase()}`;
    const cachedData = await redisConnection.get(cacheKey);

    let jobs = [];
    if (cachedData) {
      jobs = JSON.parse(cachedData);
      // Check if job already exists in cache
      const exists = jobs.some((cachedJob: any) => cachedJob.id === job.id);
      if (exists) {
        return true; // Job already in cache
      }
    }

    jobs.push(job);
    await redisConnection.set(cacheKey, JSON.stringify(jobs), "EX", ttl);
    return true;
  } catch (error) {
    console.error("Error adding job to cache:", error);
    return false;
  }
};

/**
 * Remove a job from cache
 * @param jobType The type of job (nft_mint, nft_sale, etc.)
 * @param jobId The ID of the job to remove
 */
export const removeJobFromCache = async (
  jobType: string,
  jobId: string | number
): Promise<boolean> => {
  if (!redisConnection) {
    return false;
  }

  try {
    const cacheKey = `${JOB_CACHE_PREFIX}${jobType.toLowerCase()}`;
    const cachedData = await redisConnection.get(cacheKey);

    if (!cachedData) {
      return false;
    }

    let jobs = JSON.parse(cachedData);
    const initialLength = jobs.length;
    jobs = jobs.filter((job: any) => job.id !== jobId);

    if (jobs.length === initialLength) {
      return false; // Job wasn't found
    }

    if (jobs.length === 0) {
      // If no jobs left, remove the key altogether
      await redisConnection.del(cacheKey);
    } else {
      // Update the cache with remaining jobs
      await redisConnection.set(
        cacheKey,
        JSON.stringify(jobs),
        "EX",
        DEFAULT_TTL
      );
    }

    return true;
  } catch (error) {
    console.error("Error removing job from cache:", error);
    return false;
  }
};
