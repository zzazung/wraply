const Redis = require("ioredis");

require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

async function publishLog(jobId, message) {
  await redis.publish("wraply:logs", JSON.stringify({
    type: "log",
    jobId,
    message
  }));
}

async function publishStatus(jobId, status, progress) {
  await redis.publish("wraply:logs", JSON.stringify({
    type: "status",
    jobId,
    status,
    progress
  }));
}

module.exports = {
  publishLog,
  publishStatus
};