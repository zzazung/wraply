// wraply-shared/redis/index.js

const Redis = require("ioredis");

/* --------------------------------------------------
   Base Redis
-------------------------------------------------- */

const redis = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null
  }
);

/* --------------------------------------------------
   Pub/Sub Clients (🔥 중요)
-------------------------------------------------- */

function createPublisher() {
  return redis.duplicate();
}

function createSubscriber() {
  return redis.duplicate();
}

/* --------------------------------------------------
   Export
-------------------------------------------------- */

module.exports = {
  redis,
  createPublisher,
  createSubscriber
};