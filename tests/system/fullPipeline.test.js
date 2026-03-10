const request = require("supertest");
const WebSocket = require("ws");
const http = require("http");
const Redis = require("ioredis");
const { Queue, Worker } = require("bullmq");

const app = require("../../wraply-api/app");
const { query } = require("@wraply/shared/db");

const {
  startWebSocket,
  closeWebSocket
} = require("../../wraply-api/websocket");

describe("Wraply Full Pipeline", () => {

  let server;
  let redis;
  let queue;
  let worker;
  let ws;
  let receivedLogs = [];
  let receivedStatus = [];

  const connectionOptions = {
    maxRetriesPerRequest: null
  };

  beforeAll(async () => {

    redis = new Redis(process.env.REDIS_URL);

    server = http.createServer(app);

    startWebSocket(server);

    await new Promise(resolve =>
      server.listen(4011, resolve)
    );

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

    if (queue) {
      await queue.close();
    }

    if (ws) {
      ws.close();
    }

    await closeWebSocket();

    redis.disconnect();

    await new Promise(resolve =>
      server.close(resolve)
    );

  });

  test("full pipeline", async () => {

    const jobId = "pipeline-test-job";

    /**
     * Worker
     */
    worker = new Worker(
      "wraply-build",
      async job => {

        await redis.publish(
          "wraply:logs",
          JSON.stringify({
            jobId,
            message: "build started"
          })
        );

        await redis.publish(
          "wraply:status",
          JSON.stringify({
            jobId,
            status: "building",
            progress: 50
          })
        );

        await redis.publish(
          "wraply:logs",
          JSON.stringify({
            jobId,
            message: "build finished"
          })
        );

        await redis.publish(
          "wraply:status",
          JSON.stringify({
            jobId,
            status: "finished",
            progress: 100
          })
        );

        await query(
          `
          INSERT INTO jobs
          (job_id, status, progress, created_at)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
          status=VALUES(status),
          progress=VALUES(progress)
          `,
          [jobId, "finished", 100]
        );

        return {
          status: "finished"
        };

      },
      {
        connection: new Redis(
          process.env.REDIS_URL,
          connectionOptions
        )
      }
    );

    worker.on("error", () => {});

    /**
     * WebSocket client
     */
    ws = new WebSocket(
      `ws://localhost:4011?jobId=${jobId}`
    );

    await new Promise(resolve => {

      ws.on("open", resolve);

    });

    ws.on("message", data => {

      const msg = JSON.parse(data);

      if (msg.type === "log") {
        receivedLogs.push(msg.message);
      }

      if (msg.type === "status") {
        receivedStatus.push(msg.status);
      }

    });

    /**
     * enqueue job
     */
    await queue.add("build", {
      jobId
    });

    /**
     * wait pipeline
     */
    await new Promise(resolve =>
      setTimeout(resolve, 2000)
    );

    /**
     * check websocket logs
     */
    expect(receivedLogs).toContain("build started");
    expect(receivedLogs).toContain("build finished");

    /**
     * check websocket status
     */
    expect(receivedStatus).toContain("building");
    expect(receivedStatus).toContain("finished");

    /**
     * check DB state
     */
    const rows = await query(
      `
      SELECT status, progress
      FROM jobs
      WHERE job_id = ?
      `,
      [jobId]
    );

    expect(rows[0].status).toBe("finished");
    expect(rows[0].progress).toBe(100);

  });

});