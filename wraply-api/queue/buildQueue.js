const { Queue } = require("bullmq");
const IORedis = require("ioredis");
require("dotenv").config();

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
);

const buildQueue = new Queue("build-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: false,
    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
});

async function enqueueBuild(payload) {
  const job = await buildQueue.add(
    "build",
    payload,
    {
      jobId: `build-${Date.now()}`
    }
  );

  return job.id;
}

module.exports = {
  buildQueue,
  enqueueBuild
};