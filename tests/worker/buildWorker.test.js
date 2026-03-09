const { Queue, Worker, QueueEvents } = require("bullmq");
const Redis = require("ioredis");

describe("Worker Test", () => {

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

  test("process job", async () => {

    worker = new Worker(
      "wraply-build",
      async job => {
        return { status: "finished" };
      },
      {
        connection
      }
    );

    worker.on("error", () => {});

    const job = await queue.add("build", {
      jobId: "test-job"
    });

    const result = await job.waitUntilFinished(queueEvents);

    expect(result.status).toBe("finished");

  });

});