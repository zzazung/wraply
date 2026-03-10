// wraply-shared/queue/index.js

const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const buildQueue = new Queue("wraply-build", {
  connection
});

async function enqueueBuild(data) {

  return buildQueue.add("build", data);

}

module.exports = {
  enqueueBuild
};