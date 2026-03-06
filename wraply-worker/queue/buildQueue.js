const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

const buildQueue = new Queue(
  "wraply-build",
  {
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false
    }
  }
);

async function enqueueBuild(payload) {

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