import { Redis } from "ioredis";
import { redisConnection } from "./queue";

const DEFAULT_TTL = 3600;
const JOB_CACHE_PREFIX = "job_subscriptions:";

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
      const exists = jobs.some((cachedJob: any) => cachedJob.id === job.id);
      if (exists) {
        return true;
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
      return false;
    }

    if (jobs.length === 0) {
      await redisConnection.del(cacheKey);
    } else {
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
