const { Queue, Worker } = require("bullmq");
const Redis = require("ioredis");

describe("Queue Stress Test", () => {

  let queue;
  let worker;
  let redis;

  const TOTAL_JOBS = 100;
  const CONCURRENCY = 10;

  const connectionOptions = {
    maxRetriesPerRequest: null
  };

  beforeAll(async () => {

    redis = new Redis(process.env.REDIS_URL);

    queue = new Queue("wraply-build", {
      connection: new Redis(
        process.env.REDIS_URL,
        connectionOptions
      )
    });

  });

  afterAll(async () => {

    if (worker) {
      await worker.close();
    }

    await queue.close();

    redis.disconnect();

  });

  test("process many jobs concurrently", async () => {

    const completed = new Set();

    worker = new Worker(
      "wraply-build",
      async job => {

        // simulate build
        await new Promise(r =>
          setTimeout(r, Math.random() * 50)
        );

        completed.add(job.id);

        return {
          status: "finished"
        };

      },
      {
        connection: new Redis(
          process.env.REDIS_URL,
          connectionOptions
        ),
        concurrency: CONCURRENCY
      }
    );

    worker.on("error", () => {});

    /**
     * enqueue jobs
     */
    const jobs = [];

    for (let i = 0; i < TOTAL_JOBS; i++) {

      jobs.push(
        queue.add("build", {
          jobId: `stress-${i}`
        })
      );

    }

    await Promise.all(jobs);

    /**
     * wait processing
     */
    await new Promise(resolve => {

      const interval = setInterval(() => {

        if (completed.size === TOTAL_JOBS) {

          clearInterval(interval);
          resolve();

        }

      }, 100);

    });

    /**
     * verify all jobs processed
     */
    expect(completed.size).toBe(TOTAL_JOBS);

  });

});