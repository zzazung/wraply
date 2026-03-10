const WebSocket = require("ws");
const Redis = require("ioredis");
const { query } = require("@wraply/shared/db");

const jobClients = new Map();

let redisSub = null;
let wss = null;
let heartbeatInterval = null;

const isTest = process.env.NODE_ENV === "test";
let shuttingDown = false;


/**
 * broadcast
 */
function broadcast(jobId, payload) {

  const clients = jobClients.get(jobId);

  if (!clients) {
    return;
  }

  const message = JSON.stringify(payload);

  for (const ws of [...clients]) {

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

  if (isTest || shuttingDown) {
    return;
  }

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

  if (redisSub) {
    return;
  }

  redisSub = new Redis(
    process.env.REDIS_URL || "redis://127.0.0.1:6379",
    {
      maxRetriesPerRequest: null
    }
  );

  const channels = [
    "wraply:logs",
    "wraply:status",
    "wraply:heartbeat"
  ];

  redisSub.on("ready", () => {

    console.log("Redis subscriber ready");

    redisSub.subscribe(...channels);

  });

  redisSub.on("error", err => {

    if (!shuttingDown) {
      console.error("Redis subscriber error:", err);
    }

  });

  redisSub.on("reconnecting", () => {

    if (!shuttingDown) {
      console.log("Redis reconnecting...");
    }

  });

  redisSub.on("message", async (channel, msg) => {

    if (shuttingDown) {
      return;
    }

    let data;

    try {

      data = JSON.parse(msg);

    } catch (err) {

      console.error("redis parse error:", err);
      return;

    }

    if (!data || !data.jobId) {
      return;
    }

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

      return;

    }

  });

}


/**
 * WebSocket server
 */
function startWebSocket(server) {

  if (wss) {
    return wss;
  }

  wss = new WebSocket.Server({ server });

  initRedisSubscriber();

  wss.on("connection", (ws, req) => {

    try {

      const url = new URL(req.url, "http://localhost");

      const jobId = url.searchParams.get("jobId");

      if (!jobId) {

        ws.close();
        return;

      }

      if (!jobClients.has(jobId)) {

        jobClients.set(jobId, new Set());

      }

      jobClients.get(jobId).add(ws);

      ws.isAlive = true;

      ws.on("pong", () => {

        ws.isAlive = true;

      });

      ws.on("close", () => {

        const clients = jobClients.get(jobId);

        if (!clients) {
          return;
        }

        clients.delete(ws);

        if (clients.size === 0) {

          jobClients.delete(jobId);

        }

      });

      ws.on("error", err => {

        if (!shuttingDown) {
          console.error("ws error:", err);
        }

        try {
          ws.close();
        } catch {}

      });

    } catch (err) {

      if (!shuttingDown) {
        console.error("WebSocket error:", err);
      }

      try {
        ws.close();
      } catch {}

    }

  });

  /**
   * heartbeat ping
   */
  heartbeatInterval = setInterval(() => {

    if (!wss) {
      return;
    }

    wss.clients.forEach(ws => {

      if (ws.isAlive === false) {

        try {
          ws.terminate();
        } catch {}

        return;

      }

      ws.isAlive = false;

      try {

        ws.ping();

      } catch {

        try {
          ws.terminate();
        } catch {}

      }

    });

  }, 30000);

  wss.on("close", () => {

    if (heartbeatInterval) {

      clearInterval(heartbeatInterval);
      heartbeatInterval = null;

    }

  });

  console.log("WebSocket server started");

  return wss;

}


/**
 * graceful shutdown
 */
async function closeWebSocket() {

  shuttingDown = true;

  try {

    if (heartbeatInterval) {

      clearInterval(heartbeatInterval);
      heartbeatInterval = null;

    }

  } catch (err) {

    console.error("interval shutdown error:", err);

  }

  try {

    if (redisSub) {

      await redisSub.quit();
      redisSub = null;

    }

  } catch (err) {

    console.error("redis shutdown error:", err);

  }

  try {

    if (wss) {

      for (const ws of wss.clients) {

        try {
          ws.close();
        } catch {}

      }

      await new Promise(resolve => {
        wss.close(resolve);
      });

      wss = null;

    }

  } catch (err) {

    console.error("websocket shutdown error:", err);

  }

  jobClients.clear();

  shuttingDown = false;

}


module.exports = {
  startWebSocket,
  closeWebSocket
};