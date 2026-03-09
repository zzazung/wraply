const { Queue } = require("bullmq");

const Redis = require("ioredis-mock");

describe("Build Queue", () => {

  const connection = new Redis();

  const queue = new Queue("wraply-build", {
    connection
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