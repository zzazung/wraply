const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const BUILD_QUEUE = require('@wraply/shared/constants/queues');

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

connection.on("error", err => {
  console.error("[buildQueue] redis error", err);
});

connection.on("connect", () => {
  console.log("[buildQueue] redis connected");
});

const buildQueue = new Queue(BUILD_QUEUE, {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false
  }
});

async function enqueueBuild(payload) {

  if (!payload || !payload.jobId)
    throw new Error("enqueueBuild requires payload.jobId");

  if (!payload.platform)
    throw new Error("enqueueBuild requires payload.platform");

  const jobId = payload.jobId;
  const existing = await buildQueue.getJob(jobId);
  if (existing) return existing;

  const job = await buildQueue.add(
    "build",
    payload,
    {
      jobId,
      attempts: 2,
      backoff: { type: "exponential", delay: 3000 }
    }
  );

  return job;
}

module.exports = { buildQueue, enqueueBuild };