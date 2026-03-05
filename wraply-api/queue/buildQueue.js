const { Queue } = require("bullmq");
const IORedis = require("ioredis");

require('dotenv').config();

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

const buildQueue = new Queue("build-queue", {
  connection
});

async function enqueueBuild(payload) {

  const job = await buildQueue.add(
    "build",
    payload,
    {
      attempts: 2,
      removeOnComplete: true,
    }
  );

  return job.id;
}

module.exports = {
  buildQueue,
  enqueueBuild
};