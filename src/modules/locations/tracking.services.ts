import { CacheService } from '@/core/cache/cache.service';
import { eventBus } from '@/core/events/eventBus';
import { FCMService } from '@/core/utils/fcm.utils';
import logger from '@/core/utils/logger';

import { TelemetryTrackLocationBodyInput } from './location.schema.js';

type telemetryTrack = TelemetryTrackLocationBodyInput & { timestamp: number };
export const updateChildLocation = async (
  childId: string,
  payload: TelemetryTrackLocationBodyInput,
): Promise<void> => {
  const timestamp = Date.now();

  const trackingData: telemetryTrack = {
    lng: payload.lng,
    lat: payload.lat,
    timestamp,
    ...(payload.batteryLevel && { battery: payload.batteryLevel }),
  };

  const dataStr = JSON.stringify(trackingData);

  const latestKey = `tracking:latest:${childId}`;
  await CacheService.setWithTTL(latestKey, dataStr, 24 * 60 * 60);

  const historyKey = `tracking:history:${childId}`;
  await CacheService.zAdd(historyKey, timestamp, dataStr);
  await CacheService.pub<object>(`LIVE_LOCATION_${childId}`, trackingData);

  const twentyFourHoursAgo = timestamp - 24 * 60 * 60 * 1000;
  await CacheService.zRemoveRangeByScore(
    historyKey,
    '-inf',
    twentyFourHoursAgo,
  );

  eventBus.emit(`LIVE_LOCATION_${childId}`, trackingData);
};

export const getLatestLocation = async (
  childId: string,
): Promise<telemetryTrack | null> => {
  const redisKey = `tracking:latest:${childId}`;
  const data = await CacheService.get(redisKey);

  if (!data) return null;
  return JSON.parse(data) as telemetryTrack;
};

export const getLocationHistory = async (
  childId: string,
  hoursAgo: 24,
): Promise<telemetryTrack[]> => {
  const historyKey = `tracking:history:${childId}`;
  const startTime = Date.now() - hoursAgo * 60 * 60 * 1000;

  const records = await CacheService.zRangeByScore(
    historyKey,
    startTime,
    '+inf',
  );
  return records.map((record) => JSON.parse(record) as telemetryTrack);
};

export const subscribeToLiveLocation = async (
  childId: string,
  callback: (data: telemetryTrack) => void,
) => {
  const eventName = `LIVE_LOCATION_${childId}`;

  const redisListener = (message: string) => {
    try {
      const parsedData = JSON.parse(message) as telemetryTrack;
      callback(parsedData);
    } catch (error) {
      logger.error('Failed to parse Redis Pub/Sub message', error);
    }
  };

  await CacheService.sub(eventName, redisListener);
  return async (): Promise<void> => {
    await CacheService.unsub(eventName, redisListener);
  };
};
