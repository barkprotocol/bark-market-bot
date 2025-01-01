import { promisify } from 'util';
import { redis } from '../services/redis';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS = 100; // Maximum requests per minute

export async function checkRateLimit(key: string): Promise<boolean> {
  try {
    const multi = redis.multi();
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Remove requests older than the rate limit window
    multi.zremrangebyscore(key, 0, windowStart);

    // Add the current timestamp as a request
    multi.zadd(key, now, now.toString());

    // Get the total number of requests in the window
    multi.zcard(key);

    // Set the expiration time for the sorted set (to remove old data automatically)
    multi.expire(key, 60); // 60 seconds expiration for the key

    const results = await promisify(multi.exec).bind(multi)();
    const requestCount = results[2][1] as number;

    // If the request count is within the limit, allow the request
    return requestCount <= MAX_REQUESTS;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false; // Handle errors gracefully
  }
}
