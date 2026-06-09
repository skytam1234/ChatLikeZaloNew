import 'dotenv/config';
import taskMap from './src/tasks/index.js';
import QueueService from './src/services/queue.service.js';

const POLL_INTERVAL = 5000;

async function processJob() {
  const job = await QueueService.dequeue();
  if (!job) return;

  const handler = taskMap[job.type];
  if (!handler) {
    console.error(`[Queue] No handler for type: ${job.type}`);
    await QueueService.fail(job.id, `Unknown task type: ${job.type}`);
    return;
  }

  try {
    await handler(job.payload);
    await QueueService.complete(job.id);
    console.log(`[Queue] Completed job ${job.id} (${job.type})`);
  } catch (error) {
    console.error(`[Queue] Job ${job.id} failed:`, error.message);
    await QueueService.fail(job.id, error.message);
  }
}

export function startQueueWorker() {
  console.log(`[Queue Worker] Loaded tasks: ${Object.keys(taskMap).join(', ')}`);
  console.log('[Queue Worker] Started, polling every 5s...');
  setInterval(processJob, POLL_INTERVAL);
}
