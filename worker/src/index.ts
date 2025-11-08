// Goal: Worker entry point - processes background jobs
// Listens to queue and executes job handlers

import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import path from 'path';
import { redisConnection, QUEUE_NAMES } from './config/redis.js';
import { processItemJob } from './jobs/process-item.js';
import type { ProcessItemJobData } from './queue/index.js';

// Load environment variables from root .env file
// Use process.cwd() to get project root (where npm commands run from)
const rootEnvPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: rootEnvPath });

console.log('🔧 Starting worker...');

// Create worker instance
const worker = new Worker<ProcessItemJobData>(
  QUEUE_NAMES.PROCESS_ITEM,
  async (job) => {
    console.log(`[Worker] Received job ${job.id}`);
    await processItemJob(job);
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs simultaneously
  }
);

// Event handlers
worker.on('completed', (job) => {
  console.log(`[Worker] ✓ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});

console.log(`🚀 Worker started and listening to queue: ${QUEUE_NAMES.PROCESS_ITEM}`);
console.log(`📊 Concurrency: 5 jobs`);
console.log(`🔌 Redis: ${redisConnection.host}:${redisConnection.port}`);

