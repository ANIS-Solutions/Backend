import config from '@/config/base';
import { Redis, RedisOptions } from 'ioredis';

// 1. Connection for Caching (Shared)
// export const redisCache = new Redis(config.REDIS_URL, {
//   maxRetriesPerRequest: null,
// });
export const redisCache = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});
// 2. Connection Options for BullMQ
// BullMQ often needs to create multiple connections (for blocking commands).
// Passing standard connection options is safer than passing a shared instance.
export const redisQueueConnection = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
} as unknown as RedisOptions;

redisCache.on('error', (err) => console.error('Redis Cache Error:', err));
redisCache.on('connect', () => console.log('Redis Cache Connected'));
