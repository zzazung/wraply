const redis = require("../redis");

async function publishLog(jobId, message) {

  await redis.publish(
    "wraply:logs",
    JSON.stringify({
      jobId,
      message
    })
  );

}

async function publishStatus(jobId, status, progress) {

  await redis.publish(
    "wraply:status",
    JSON.stringify({
      jobId,
      status,
      progress
    })
  );

}

module.exports = {
  publishLog,
  publishStatus
};