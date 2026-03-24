// wraply-worker/queue/aiWorker.js

const { Worker } = require("bullmq");

const redis = require("@wraply/shared/redis");
const { runTask } = require("../tasks");

const { publishAgentEvent } = require("../bus/logBus");

const { AI_QUEUE } = require("@wraply/shared/constants/queues");

const QUEUE_NAME = AI_QUEUE;

/* --------------------------------------------------
   Worker
-------------------------------------------------- */

const aiWorker = new Worker(

  QUEUE_NAME,

  async (job) => {

    const {
      jobId,
      task,
      payload,
      tenantId
    } = job.data;

    const meta = {
      attempt: job.attemptsMade,
      timestamp: Date.now()
    };

    /* 🔥 STEP_START */

    publishAgentEvent({
      jobId,
      tenantId,
      event:"STEP_START",
      step: task
    });

    console.log("[ai-worker] start", {
      jobId,
      task,
      attempt: meta.attempt
    });

    try {

      const result = await runTask({
        jobId,
        task,
        context: payload,
        meta
      });

      /* 🔥 STEP_DONE */

      publishAgentEvent({
        jobId,
        tenantId,
        event:"STEP_DONE",
        step: task,
        output: result
      });

      console.log("[ai-worker] success", {
        jobId,
        task,
        result
      });

      return result;

    } catch (err) {

      /* 🔥 STEP_FAIL */

      publishAgentEvent({
        jobId,
        tenantId,
        event:"STEP_FAIL",
        step: task,
        error: err.message
      });

      console.error("[ai-worker] fail", {
        jobId,
        task,
        error: err.message
      });

      throw err;

    }

  },

  {
    connection: redis,
    concurrency: 5,        // 🔥 중요 (튜닝 포인트)
    lockDuration: 30000    // 🔥 job timeout 보호
  }

);

/* --------------------------------------------------
   Events
-------------------------------------------------- */

aiWorker.on("completed", (job, result) => {

  publishAgentEvent(job.data.jobId, {
    jobId: job.data.jobId,
    tenantId: job.data.tenantId,
    event:"STEP_DONE",
    step: job.data.task,
    output: result
  });

  console.log("[ai-worker] completed", {
    jobId: job.data.jobId,
    task: job.data.task,
    result
  });

});

aiWorker.on("failed", (job, err) => {

  publishAgentEvent({
    jobId: job.data?.jobId,
    tenantId: job.data?.tenantId,
    event:"STEP_FAIL",
    step: job.data?.task,
    error: err.message
  });

  console.error("[ai-worker] failed", {
    jobId: job.data?.jobId,
    task: job.data?.task,
    error: err?.message
  });

});

/* --------------------------------------------------
   Export (graceful shutdown용)
-------------------------------------------------- */

module.exports = aiWorker;