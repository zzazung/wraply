const { Queue } = require("bullmq");
const redis = require("@wraply/shared/redis");

require("dotenv").config();

const QUEUE_NAME = "build";

/**
 * Build Queue
 */
const buildQueue = new Queue(
  QUEUE_NAME,
  {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      }
    }
  }
);

/**
 * queue error logging
 */
buildQueue.on("error", err => {
  console.error("BuildQueue error:", err);
});

buildQueue.on("failed", (job, err) => {
  console.error("Build job failed:", job?.id, err);
});

/**
 * enqueue build job
 */
async function enqueueBuild(data) {

  if (!data || typeof data !== "object") {
    throw new Error("invalid build job payload");
  }

  if (!data.jobId) {
    throw new Error("jobId required");
  }

  const job = await buildQueue.add(
    QUEUE_NAME,
    data,
    { jobId: data.jobId }
  );

  return job.id;
}

module.exports = {
  enqueueBuild,
  buildQueue
};