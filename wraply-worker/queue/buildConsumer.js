// wraply-worker/queue/buildConsumer.js

const { Worker } = require("bullmq");

const redis = require("@wraply/shared/redis");

const { runBuild } = require("./buildWorker");

const { BUILD_QUEUE } = require("@wraply/shared/constants/queues");

const worker = new Worker(

  BUILD_QUEUE,

  async (job) => {

    const { id: jobId, data } = job;

    console.log("[build-worker] start", {
      jobId
    });

    try {

      const result = await runBuild({
        jobId,
        ...data
      });

      console.log("[build-worker] success", {
        jobId,
        result
      });

      return result;

    } catch (err) {

      console.error("[build-worker] fail", {
        jobId,
        error: err.message
      });

      throw err;

    }

  },

  {
    connection: redis
  }

);

/* --------------------------------------------------
   Events
-------------------------------------------------- */

worker.on("completed", (job, result) => {

  console.log("[build-worker] completed", {
    jobId: job.id,
    result
  });

});

worker.on("failed", (job, err) => {

  console.error("[build-worker] failed", {
    jobId: job?.id,
    error: err?.message
  });

});

module.exports = worker;