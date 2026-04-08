import { redisCache } from '@/config/redis';

export const CacheService = {
  async setWithTTL(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    await redisCache.set(key, value, 'EX', ttlSeconds);
  },

  async get(key: string): Promise<string | null> {
    return await redisCache.get(key);
  },

  async delete(key: string): Promise<void> {
    await redisCache.del(key);
  },
};
