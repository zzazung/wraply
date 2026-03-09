const { Queue } = require("bullmq");
const IORedis = require("ioredis");

require("dotenv").config();

const REDIS_URL =
  process.env.REDIS_URL ||
  "redis://127.0.0.1:6379";

/**
 * Redis connection
 */
const connection =
  new IORedis(
    REDIS_URL,
    {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true
    }
  );

/**
 * Redis error log
 */
connection.on("error", (err) => {

  console.error(
    "Redis connection error:",
    err
  );

});

connection.on("connect", () => {

  console.log(
    "Redis connected"
  );

});

/**
 * Build Queue
 */
const buildQueue =
  new Queue(
    "build",
    {
      connection,

      defaultJobOptions: {

        removeOnComplete: true,

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
buildQueue.on("error", (err) => {

  console.error(
    "BuildQueue error:",
    err
  );

});

buildQueue.on("failed", (job, err) => {

  console.error(
    "Build job failed:",
    job?.id,
    err
  );

});

/**
 * enqueue build job
 */
async function enqueueBuild(data) {

  if (!data || typeof data !== "object") {
    throw new Error(
      "invalid build job payload"
    );
  }

  const jobId =
    data.jobId ||
    `build_${Date.now()}`;

  const job =
    await buildQueue.add(
      "build",
      data,
      {
        jobId
      }
    );

  return job.id;

}

module.exports = {
  enqueueBuild,
  buildQueue
};