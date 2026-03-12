const { Worker } = require("bullmq");

const redis =
  require("@wraply/shared/redis");

const { runBuild } =
  require("./buildWorker");

const worker = new Worker(
  "wraply-build",
  async job => {

    await runBuild(job.data);

  },
  {
    connection: redis
  }
);

worker.on("completed", job => {

  console.log(
    "[wraply-worker] job completed",
    job.id
  );

});

worker.on("failed", (job, err) => {

  console.error(
    "[wraply-worker] job failed",
    job?.id,
    err
  );

});