const { Queue, Worker, QueueEvents } = require("bullmq");
const Redis = require("ioredis");

describe("Worker Test", () => {

  let redis;
  let queue;
  let worker;
  let queueEvents;

  beforeAll(async () => {

    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });

    queue = new Queue("wraply-build", {
      connection: redis
    });

    queueEvents = new QueueEvents("wraply-build", {
      connection: redis
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

    if (redis) {
      await redis.quit();
    }

  });

  afterEach(async () => {

    if (queue) {
      await queue.drain();
    }

  });

  test("worker processes job", async () => {

    worker = new Worker(
      "wraply-build",
      async job => {
        return { status: "finished" };
      },
      {
        connection: redis
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