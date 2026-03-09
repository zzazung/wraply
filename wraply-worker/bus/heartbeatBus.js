const Redis = require("ioredis");

const redis = new Redis(
  process.env.REDIS_URL ||
  "redis://localhost:6379"
);

function startHeartbeat(jobId) {

  const timer = setInterval(() => {

    redis.publish(
      "wraply:heartbeat",
      JSON.stringify({
        jobId,
        ts: Date.now()
      })
    );

  }, 10000);

  return timer;

}

function stopHeartbeat(timer) {

  if (timer) {
    clearInterval(timer);
  }

}

module.exports = {
  startHeartbeat,
  stopHeartbeat
};