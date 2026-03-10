const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null
  }
);

const buildQueue = new Queue(
  "wraply-build",
  { connection }
);

async function enqueueBuild(data) {

  return buildQueue.add(
    "build",
    data,
    {
      removeOnComplete: true,
      removeOnFail: false
    }
  );

}

module.exports = {
  buildQueue,
  enqueueBuild
};