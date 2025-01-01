import { redis } from './redis';

const CACHE_TTL = 60 * 5; // 5 minutes

export class CacheService {
  static async get(key: string): Promise<string | null> {
    return await redis.get(key);
  }

  static async set(key: string, value: string): Promise<void> {
    await redis.set(key, value, 'EX', CACHE_TTL);
  }

  static async getOrSet(key: string, fetchFn: () => Promise<string>): Promise<string> {
    const cachedValue = await this.get(key);
    if (cachedValue) {
      return cachedValue;
    }

    const newValue = await fetchFn();
    await this.set(key, newValue);
    return newValue;
  }
}
