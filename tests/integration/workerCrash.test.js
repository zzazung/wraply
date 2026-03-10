const { Queue, Worker, QueueEvents } = require("bullmq");
const Redis = require("ioredis");

describe("Worker Crash Recovery", () => {

  let connection;
  let queue;
  let worker;
  let queueEvents;

  beforeAll(async () => {

    connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null
    });

    queue = new Queue("wraply-build", {
      connection
    });

    queueEvents = new QueueEvents("wraply-build", {
      connection
    });

    await queueEvents.waitUntilReady();

  });

  afterAll(async () => {

    if (worker) {
      await worker.close();
    }

    if (queue) {
      await queue.close();
    }

    if (queueEvents) {
      await queueEvents.close();
    }

    if (connection) {
      await connection.quit();
    }

  });

  test("worker crash", async () => {

    worker = new Worker(
      "wraply-build",
      async () => {
        throw new Error("worker crash");
      },
      {
        connection
      }
    );

    worker.on("error", () => {});

    const job = await queue.add("build", {
      jobId: "crash-test"
    });

    await new Promise(resolve => {
      worker.once("failed", () => resolve());
    });

    const failed = await queue.getFailed();

    expect(failed.length).toBeGreaterThan(0);

  });

});