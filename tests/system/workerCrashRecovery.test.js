const { Queue, Worker, QueueEvents } = require("bullmq");
const Redis = require("ioredis");

describe("Worker Crash Recovery", () => {

  let queue;
  let worker;
  let queueEvents;

  const connection = new Redis(
    process.env.REDIS_URL,
    { maxRetriesPerRequest: null }
  );

  beforeAll(async () => {

    queue = new Queue("wraply-build", {
      connection
    });

    queueEvents = new QueueEvents(
      "wraply-build",
      { connection }
    );

    await queueEvents.waitUntilReady();

  });

  afterAll(async () => {

    if (worker) {
      await worker.close();
    }

    await queue.close();
    await queueEvents.close();

    connection.disconnect();

  });

  test("job retry after worker crash", async () => {

    let attempts = 0;

    worker = new Worker(
      "wraply-build",
      async () => {

        attempts++;

        if (attempts === 1) {
          throw new Error("simulated crash");
        }

        return { status: "finished" };

      },
      {
        connection,
        concurrency: 1
      }
    );

    worker.on("error", () => {});

    const job = await queue.add(
      "build",
      { jobId: "crash-test" },
      { attempts: 2 }
    );

    const result =
      await job.waitUntilFinished(queueEvents);

    expect(result.status).toBe("finished");

  });

});