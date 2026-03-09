const { Queue, Worker } = require("bullmq");

const Redis = require("ioredis");

describe("Build Pipeline", () => {

  const connection = new Redis();

  const queue = new Queue("wraply-build", {
    connection
  });

  test("full pipeline", async () => {

    const worker = new Worker(
      "wraply-build",
      async job => {

        return { status: "finished" };

      },
      { connection }
    );

    const job = await queue.add("build", {
      jobId: "ci-pipeline-job"
    });

    const result = await job.waitUntilFinished(connection);

    expect(result.status).toBe("finished");

    await worker.close();

  });

});