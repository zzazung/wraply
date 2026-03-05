const { Worker } = require("bullmq");
const IORedis = require("ioredis");

const { runBuild } = require("./buildWorker");

require('dotenv').config();

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

const worker = new Worker(
  "wraply-build",
  async job => {

    const payload = job.data;

    await runBuild(payload);

  },
  { connection }
);

worker.on("completed", job => {

  console.log("build completed", job.id);

});

worker.on("failed", (job, err) => {

  console.error("build failed", err);

});