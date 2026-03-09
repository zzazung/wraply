const request = require("supertest");
const http = require("http");
const Redis = require("ioredis");
const { Queue, Worker, QueueEvents } = require("bullmq");

const app = require("../../wraply-api/app");
const db = require("@wraply/shared/db");

describe("Wraply System Build Pipeline", () => {

  let server;
  let redis;
  let queue;
  let worker;
  let queueEvents;

  const jobId = "system-test-job";

  beforeAll(async () => {

    server = http.createServer(app);

    await new Promise(resolve => server.listen(4020, resolve));

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

    /**
     * fake worker
     */
    worker = new Worker(
      "wraply-build",
      async job => {

        await redis.publish(
          "wraply:status",
          JSON.stringify({
            jobId,
            status: "building",
            progress: 50
          })
        );

        await new Promise(r => setTimeout(r, 100));

        await redis.publish(
          "wraply:status",
          JSON.stringify({
            jobId,
            status: "finished",
            progress: 100
          })
        );

        await db.query(
          `
          UPDATE jobs
          SET status='finished', progress=100
          WHERE job_id=?
          `,
          [jobId]
        );

        return { status: "finished" };

      },
      {
        connection: redis
      }
    );

    worker.on("error", () => {});

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

    await new Promise(resolve => server.close(resolve));

  });

  test("full build pipeline", async () => {

    /**
     * job 생성
     */
    await db.query(
      `
      INSERT INTO jobs
      (job_id, status, progress, created_at)
      VALUES (?, 'queued', 0, NOW())
      `,
      [jobId]
    );

    /**
     * queue enqueue
     */
    const job = await queue.add(
      "build",
      {
        jobId
      }
    );

    const result =
      await job.waitUntilFinished(queueEvents);

    expect(result.status).toBe("finished");

    /**
     * DB 검증
     */
    const rows = await db.query(
      `
      SELECT status, progress
      FROM jobs
      WHERE job_id=?
      `,
      [jobId]
    );

    expect(rows[0].status).toBe("finished");
    expect(rows[0].progress).toBe(100);

  });

});