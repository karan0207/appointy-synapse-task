// Goal: Setup Redis connection for BullMQ
// Provides connection configuration for queue system

import { ConnectionOptions } from 'bullmq';

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
};

export const QUEUE_NAMES = {
  PROCESS_ITEM: 'process-item',
} as const;

