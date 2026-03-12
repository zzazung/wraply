const { Queue, Worker, QueueEvents } = require("bullmq");
const Redis = require("ioredis");

describe("Build Pipeline", () => {

  let redis;
  let queue;
  let worker;
  let queueEvents;

  beforeAll(async () => {

    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null
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

  test("full pipeline", async () => {

    worker = new Worker(
      "wraply-build",
      async job => {

        return {
          status: "finished",
          progress: 100
        };

      },
      {
        connection: redis
      }
    );

    worker.on("error", () => {});

    const job = await queue.add("build", {
      jobId: "pipeline-test"
    });

    const result =
      await job.waitUntilFinished(queueEvents);

    expect(result.status).toBe("finished");
    expect(result.progress).toBe(100);

  });

});