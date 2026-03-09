const { Queue, Worker } = require("bullmq");

const Redis = require("ioredis");

describe("Worker Crash Recovery", () => {

  const connection = new Redis();

  const queue = new Queue("wraply-build", { connection });

  test("worker crash", async () => {

    const worker = new Worker(
      "wraply-build",
      async () => {

        throw new Error("worker crash");

      },
      { connection }
    );

    const job = await queue.add("build", {
      jobId: "crash-job"
    });

    await expect(
      job.waitUntilFinished(connection)
    ).rejects.toThrow();

    await worker.close();

  });

});