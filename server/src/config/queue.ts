// Goal: Setup queue connection in server for adding jobs
// Server only adds jobs, worker processes them

import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisConnection = {
  host: REDIS_URL.replace('redis://', '').split(':')[0],
  port: parseInt(REDIS_URL.split(':')[2] || '6379'),
  maxRetriesPerRequest: null,
};

export interface ProcessItemJobData {
  itemId: string;
  type: 'text' | 'link' | 'file';
}

// Create queue instance for adding jobs
export const processItemQueue = new Queue<ProcessItemJobData>(
  'process-item',
  {
    connection: redisConnection,
  }
);

// Helper function to queue item processing
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

