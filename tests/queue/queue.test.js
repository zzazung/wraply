const { Queue } = require("bullmq");
const Redis = require("ioredis");

describe("Build Queue", () => {

  let redis;
  let queue;

  beforeAll(async () => {

    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null
    });

    queue = new Queue("wraply-build", {
      connection: redis
    });

  });

  afterAll(async () => {

    if (queue) {
      await queue.close();
    }

    if (redis) {
      await redis.quit();
    }

  });

  test("enqueue job", async () => {

    const job = await queue.add("build", {
      jobId: "test-job-1",
      platform: "android"
    });

    expect(job).toBeDefined();
    expect(job.name).toBe("build");

  });

});