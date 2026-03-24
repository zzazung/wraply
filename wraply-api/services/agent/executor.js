// wraply-api/services/agent/executor.js

const { Queue } = require("bullmq");

const { AI_QUEUE } = require("@wraply/shared/constants/queues");

const queue = new Queue(AI_QUEUE, {
  connection: { host: "127.0.0.1", port: 6379 }
});

async function runStep({ step, context }) {

  const job = await queue.add("ai-task", {
    task: step.task,
    payload: context
  });

  return job;

}

module.exports = {
  runStep
};