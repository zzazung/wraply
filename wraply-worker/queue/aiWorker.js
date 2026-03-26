// wraply-worker/queue/aiWorker.js

const { Worker } = require("bullmq");
const { v4: uuidv4 } = require("uuid");

const redis = require("@wraply/shared/redis");
const { runTask } = require("../tasks");

const { publishAgentEvent } = require("../bus/logBus");
const { AI_QUEUE } = require("@wraply/shared/constants/queues");

const QUEUE_NAME = AI_QUEUE;

const aiWorker = new Worker(

  QUEUE_NAME,

  async (job) => {

    const { jobId, task, payload, tenantId } = job.data;

    const meta = {
      attempt: job.attemptsMade,
      timestamp: Date.now()
    };

    /* 🔥 STEP_START */

    publishAgentEvent({
      id: uuidv4(),
      type:"agent_event",
      jobId,
      tenantId,
      event:"STEP_START",
      step: task,
      ts: Date.now()
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
        id: uuidv4(),
        type:"agent_event",
        jobId,
        tenantId,
        event:"STEP_DONE",
        step: task,
        output: result,
        ts: Date.now()
      });

      return result;

    } catch (err) {

      /* 🔥 STEP_FAILED */

      publishAgentEvent({
        id: uuidv4(),
        type:"agent_event",
        jobId,
        tenantId,
        event:"STEP_FAILED",
        step: task,
        error: err.message,
        ts: Date.now()
      });

      throw err;

    }

  },

  {
    connection: redis,
    concurrency: 5,
    lockDuration: 30000
  }

);

module.exports = aiWorker;