// wraply-worker/queue/aiWorker.js

const { Worker } = require("bullmq");
const { runTask } = require("../tasks/aiTasks");

const connection = {
  host: "127.0.0.1",
  port: 6379
};

const aiWorker = new Worker(

  "ai-queue",

  async job => {

    const { jobId, task, payload } = job.data;

    console.log("[worker] start:", jobId, task);

    try {

      const result = await runTask(task, payload);

      console.log("[worker] done:", jobId);

      return result;

    } catch (err) {

      console.error("[worker] error:", err);

      throw err;

    }

  },

  { connection }

);

aiWorker.on("completed", job => {
  console.log("[worker] completed:", job.id);
});

aiWorker.on("failed", (job, err) => {
  console.error("[worker] failed:", job.id, err.message);
});