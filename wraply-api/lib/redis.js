// api/lib/redis.js

const Redis = require("ioredis");

let redis = null;

function getRedis() {

  if (redis) return redis;

  const redisUrl =
    process.env.REDIS_URL ||
    "redis://127.0.0.1:6379";

  redis = new Redis(redisUrl, {

    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,

    reconnectOnError(err) {

      console.error("redis reconnect error:", err);

      return true;

    }

  });

  redis.on("connect", () => {
    console.log("Redis connected");
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err);
  });

  return redis;

}

module.exports = getRedis();