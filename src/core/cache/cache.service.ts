import { redisCache, redisSubscriber } from '@/config/redis';

const channelListeners = new Map<string, ((message: string) => void)[]>();

redisSubscriber.on('message', (channel, message) => {
  const listeners = channelListeners.get(channel);
  if (listeners) {
    listeners.forEach((cb) => cb(message));
  }
});

export const CacheService = {
  async update(key: string, value: string): Promise<void> {
    await redisCache.set(key, value);
  },
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

  async zAdd(key: string, score: number, value: string): Promise<void> {
    await redisCache.zadd(key, score, value);
  },

  async zRangeByScore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<string[]> {
    return await redisCache.zrangebyscore(key, min, max);
  },

  async zRemoveRangeByScore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<void> {
    await redisCache.zremrangebyscore(key, min, max);
  },

  async pub<T>(channelKey: string, data: T): Promise<void> {
    await redisCache.publish(channelKey, JSON.stringify(data));
  },

  async sub(channelKey: string, cb: (message: string) => void): Promise<void> {
    if (!channelListeners.has(channelKey)) {
      channelListeners.set(channelKey, []);
      await redisSubscriber.subscribe(channelKey);
    }
    channelListeners.get(channelKey)!.push(cb);
  },

  async unsub(
    channelKey: string,
    cb: (message: string) => void,
  ): Promise<void> {
    const listeners = channelListeners.get(channelKey);
    if (!listeners) return;

    const updatedListeners = listeners.filter((listener) => listener !== cb);

    if (updatedListeners.length === 0) {
      channelListeners.delete(channelKey);
      await redisSubscriber.unsubscribe(channelKey);
    } else {
      channelListeners.set(channelKey, updatedListeners);
    }
  },

  async incby(channelKey: string, incrementValue: number): Promise<number> {
    return await redisCache.incrby(channelKey, incrementValue);
  },

  async setTTL(key: string, ttlSeconds: number): Promise<void> {
    await redisCache.expire(key, ttlSeconds);
  },
  async scanPattern(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, elements] = await redisCache.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...elements);
    } while (cursor !== '0');

    return keys;
  },

  async mGet(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    return await redisCache.mget(...keys);
  },

  async exists(key: string): Promise<boolean> {
    const result = await redisCache.exists(key);
    return result > 0;
  },
};
