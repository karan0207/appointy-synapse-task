// Goal: Setup BullMQ queue for background jobs
// Exports queue instance and job types

import { Queue } from 'bullmq';
import { redisConnection, QUEUE_NAMES } from '../config/redis.js';

export interface ProcessItemJobData {
  itemId: string;
  type: 'text' | 'link' | 'file';
}

// Create queue instance
export const processItemQueue = new Queue<ProcessItemJobData>(
  QUEUE_NAMES.PROCESS_ITEM,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 100,
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  }
);

// Helper function to add job to queue
export async function queueItemProcessing(
  itemId: string,
  type: 'text' | 'link' | 'file' = 'text'
): Promise<void> {
  await processItemQueue.add(
    'process-item',
    { itemId, type },
    {
      jobId: `item-${itemId}`,
    }
  );
}

