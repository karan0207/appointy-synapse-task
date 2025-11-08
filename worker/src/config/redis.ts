// Goal: Setup Redis connection for BullMQ
// Provides connection configuration for queue system

import { ConnectionOptions } from 'bullmq';

export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisConnection: ConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

export const QUEUE_NAMES = {
  PROCESS_ITEM: 'process-item',
} as const;

