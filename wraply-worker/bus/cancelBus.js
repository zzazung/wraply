const Redis = require("ioredis");

const { cancelBuild } = require("../queue/buildRegistry");

const redis = new Redis(
  process.env.REDIS_URL
);

async function startCancelListener() {

  await redis.subscribe("wraply:cancel");

  redis.on("message", async (channel, message) => {

    if (channel !== "wraply:cancel")
      return;

    try {

      const payload =
        JSON.parse(message);

      const jobId = payload.jobId;

      console.log(
        "[worker] cancel request",
        jobId
      );

      cancelBuild(jobId);

    } catch (err) {

      console.error(
        "cancel message error",
        err
      );

    }

  });

}

module.exports = {
  startCancelListener
};