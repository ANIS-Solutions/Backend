import config from '@/config/base';
import logger from '@/core/utils/logger';
import { Redis, RedisOptions } from 'ioredis';

export const redisCache = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const redisQueueConnection: RedisOptions = {
  host: config.REDIS_HOST,
  port: +config.REDIS_PORT,
  ...(config.REDIS_PASSWORD ? { password: config.REDIS_PASSWORD } : {}),
  maxRetriesPerRequest: null,
};

redisCache.on('error', (err) => logger.error('Redis Cache Error:', err));
redisCache.on('connect', () => logger.info('Redis Cache Connected'));
