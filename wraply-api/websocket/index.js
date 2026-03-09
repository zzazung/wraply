const WebSocket = require("ws");
const Redis = require("ioredis");
const { query } = require("@wraply/shared/db");

const jobClients = new Map();

let redisSub = null;

/**
 * broadcast
 */
function broadcast(jobId, payload) {

  const clients = jobClients.get(jobId);
  if (!clients) return;

  const message = JSON.stringify(payload);

  for (const ws of clients) {

    if (ws.readyState === WebSocket.OPEN) {

      try {
        ws.send(message);
      } catch (err) {
        console.error("ws send error:", err);
        clients.delete(ws);
      }

    } else {

      clients.delete(ws);

    }

  }

}

/**
 * heartbeat update
 */
async function updateHeartbeat(jobId) {

  try {

    await query(
      `
      UPDATE jobs
      SET heartbeat_at = NOW()
      WHERE job_id = ?
      `,
      [jobId]
    );

  } catch (err) {

    console.error("heartbeat update error:", err);

  }

}

/**
 * Redis subscriber
 */
function initRedisSubscriber() {

  if (redisSub) return;

  redisSub = new Redis(
    process.env.REDIS_URL ||
    "redis://127.0.0.1:6379"
  );

  redisSub.subscribe(
    "wraply:logs",
    "wraply:status",
    "wraply:heartbeat"
  );

  redisSub.on("message", async (channel, msg) => {

    let data;

    try {

      data = JSON.parse(msg);

    } catch (err) {

      console.error("redis parse error:", err);
      return;

    }

    if (!data || !data.jobId)
      return;

    if (channel === "wraply:heartbeat") {

      await updateHeartbeat(data.jobId);
      return;

    }

    if (channel === "wraply:logs") {

      broadcast(data.jobId, {
        type: "log",
        jobId: data.jobId,
        message: data.message,
        ts: Date.now()
      });

      return;

    }

    if (channel === "wraply:status") {

      broadcast(data.jobId, {
        type: "status",
        jobId: data.jobId,
        status: data.status,
        progress: data.progress,
        ts: Date.now()
      });

    }

  });

}

/**
 * WebSocket server
 */
function startWebSocket(server) {

  const wss = new WebSocket.Server({ server });

  initRedisSubscriber();

  wss.on("connection", (ws, req) => {

    try {

      const url =
        new URL(req.url, "http://localhost");

      const jobId =
        url.searchParams.get("jobId");

      if (!jobId) {

        ws.close();
        return;

      }

      if (!jobClients.has(jobId)) {

        jobClients.set(jobId, new Set());

      }

      jobClients.get(jobId).add(ws);

      ws.on("close", () => {

        const clients =
          jobClients.get(jobId);

        if (!clients) return;

        clients.delete(ws);

        if (clients.size === 0) {

          jobClients.delete(jobId);

        }

      });

    } catch (err) {

      console.error("WebSocket error:", err);

      try { ws.close(); } catch {}

    }

  });

  console.log("WebSocket server started");

}

module.exports = startWebSocket;