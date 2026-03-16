const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const { Queue } = require("bullmq");
const redis = require("@wraply/shared/redis");

const { BUILD_QUEUE } = require("@wraply/shared/constants/queues");

/**
 * Build Queue
 */
const buildQueue = new Queue(
  BUILD_QUEUE,
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
  console.log('enqueueBuild', data);

  if (!data || typeof data !== "object") {
    throw new Error("invalid build job payload");
  }

  if (!data.jobId) {
    throw new Error("jobId required");
  }

  const job = await buildQueue.add(
    BUILD_QUEUE,
    data,
    { jobId: data.jobId }
  );

  return job.id;
}

module.exports = {
  enqueueBuild,
  buildQueue
};