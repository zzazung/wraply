const http = require("http");
const WebSocket = require("ws");
const request = require("supertest");
const Redis = require("ioredis");
const { Queue, Worker, QueueEvents } = require("bullmq");

const app = require("../../wraply-api/app");
const db = require("@wraply/shared/db");
const { startWebSocket, closeWebSocket } =
  require("../../wraply-api/websocket");

describe("Wraply Full Pipeline E2E", () => {

  let server;
  let redis;
  let queue;
  let worker;
  let queueEvents;

  const port = 4030;
  const jobId = "e2e-full-test";

  beforeAll(async () => {

    server = http.createServer(app);

    startWebSocket(server);

    await new Promise(resolve =>
      server.listen(port, resolve)
    );

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
     * Fake Worker
     */
    worker = new Worker(
      "wraply-build",
      async job => {

        const { jobId } = job.data;

        await redis.publish(
          "wraply:logs",
          JSON.stringify({
            jobId,
            message: "build started"
          })
        );

        await new Promise(r => setTimeout(r, 200));

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

    await closeWebSocket();

    await new Promise(resolve =>
      server.close(resolve)
    );

  });

  test("full pipeline", async () => {

    /**
     * DB job 생성
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
     * websocket client
     */
    const ws =
      new WebSocket(`ws://localhost:${port}?jobId=${jobId}`);

    const messages = [];

    ws.on("message", data => {
      messages.push(JSON.parse(data));
    });

    await new Promise(resolve => ws.on("open", resolve));

    /**
     * enqueue
     */
    const job = await queue.add("build", {
      jobId
    });

    await job.waitUntilFinished(queueEvents);

    /**
     * DB 확인
     */
    const rows = await db.query(
      `
      SELECT status, progress
      FROM jobs
      WHERE job_id=?
      `,
      [jobId]
    );

    expect(rows.length).toBeGreaterThan(0);

    expect(rows[0].status).toBe("finished");
    expect(rows[0].progress).toBe(100);

    ws.close();

  });
});