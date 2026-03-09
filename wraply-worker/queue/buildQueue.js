const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const QUEUE_NAME = "wraply-build";

const connection = new IORedis(REDIS_URL);

connection.on("error", err => {
  console.error("[buildQueue] redis error", err);
});

connection.on("connect", () => {
  console.log("[buildQueue] redis connected");
});

const buildQueue = new Queue(
  QUEUE_NAME,
  {
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false
    }
  }
);

async function enqueueBuild(payload) {

  if (!payload || !payload.jobId) {
    throw new Error("enqueueBuild requires payload.jobId");
  }

  const jobId = payload.jobId;

  const existing = await buildQueue.getJob(jobId);

  if (existing) {
    return existing;
  }

  const job = await buildQueue.add(
    "build",
    payload,
    {
      jobId,
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 3000
      }
    }
  );

  return job;

}

module.exports = {
  buildQueue,
  enqueueBuild
};