const WebSocket = require("ws");
const redis = require("@wraply/shared/redis");
const { query } = require("@wraply/shared/db");

const jobClients = new Map();

let wss = null;
let redisSub = null;
let heartbeatInterval = null;

/* --------------------------------------------------
   broadcast
-------------------------------------------------- */

function broadcast(jobId, payload) {
  const clients = jobClients.get(jobId);
  if (!clients) return;

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

/* --------------------------------------------------
   broadcast helpers (tests compatibility)
-------------------------------------------------- */

function broadcastLog(jobId, message) {
  broadcast(jobId, {
    type: "log",
    jobId,
    message,
    ts: Date.now()
  });
}

function broadcastStatus(jobId, status, progress) {
  broadcast(jobId, {
    type: "status",
    jobId,
    status,
    progress,
    ts: Date.now()
  });
}

/* --------------------------------------------------
   heartbeat update (worker heartbeat)
-------------------------------------------------- */

async function updateHeartbeat(jobId) {
  try {
    await query(
      "UPDATE jobs SET heartbeat_at = NOW() WHERE job_id = ?",
      [jobId]
    );
  } catch (err) {
    console.error("heartbeat update error:", err);
  }
}

/* --------------------------------------------------
   Redis subscriber
-------------------------------------------------- */

function initRedisSubscriber() {
  if (redisSub) return;

  redisSub = redis.duplicate();

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
    console.error("Redis subscriber error:", err);
  });

  redisSub.on("reconnecting", () => {
    console.log("Redis reconnecting...");
  });

  redisSub.on("message", async (channel, msg) => {
    let data;

    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.error("redis parse error:", err);
      return;
    }

    if (!data || !data.jobId) return;

    if (channel === "wraply:heartbeat") {
      await updateHeartbeat(data.jobId);
      return;
    }

    if (channel === "wraply:logs") {
      broadcastLog(data.jobId, data.message);
      return;
    }

    if (channel === "wraply:status") {
      broadcastStatus(data.jobId, data.status, data.progress);
    }
  });
}

/* --------------------------------------------------
   WebSocket server
-------------------------------------------------- */

function startWebSocket(server) {
  if (wss) {
    console.log("WebSocket already started");
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
        if (!clients) return;

        clients.delete(ws);

        if (clients.size === 0) {
          jobClients.delete(jobId);
        }
      });

      ws.on("error", err => {
        console.error("ws error:", err);
        try { ws.close(); } catch {}
      });

    } catch (err) {
      console.error("WebSocket error:", err);
      try { ws.close(); } catch {}
    }
  });

  heartbeatInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) {
        try { ws.terminate(); } catch {}
        return;
      }

      ws.isAlive = false;

      try {
        ws.ping();
      } catch {
        try { ws.terminate(); } catch {}
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

/* --------------------------------------------------
   graceful shutdown
-------------------------------------------------- */

async function closeWebSocket() {
  try {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    if (wss) {
      await new Promise(resolve => wss.close(resolve));
      wss = null;
    }

    if (redisSub) {
      await redisSub.quit();
      redisSub = null;
    }

    jobClients.clear();

    console.log("WebSocket server closed");

  } catch (err) {
    console.error("closeWebSocket error:", err);
  }
}

module.exports = {
  startWebSocket,
  closeWebSocket,
  broadcastLog,
  broadcastStatus
};