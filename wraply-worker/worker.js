require("dotenv").config();

const Redis = require("ioredis");
const { recoverJobs } = require("@wraply/shared/job/jobRecovery");
const { startCancelListener } = require("./bus/cancelBus");

const redis = new Redis(process.env.REDIS_URL);

async function start() {
  try {
    console.log("[wraply-worker] starting worker");

    // recover jobs that were left in building state
    await recoverJobs();

    console.log("[wraply-worker] job recovery completed");

    // start queue consumer
    require("./queue/buildConsumer");

    console.log("[wraply-worker] build consumer started");

    await startCancelListener();
  } catch (err) {
    console.error("[wraply-worker] startup error", err);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    console.log("[wraply-worker] shutting down");

    await redis.quit();

    process.exit(0);
  } catch (err) {
    console.error("[wraply-worker] shutdown error", err);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("uncaughtException", err => {
  console.error("[wraply-worker] uncaughtException", err);
});

process.on("unhandledRejection", err => {
  console.error("[wraply-worker] unhandledRejection", err);
});

start();