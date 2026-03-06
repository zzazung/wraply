const WebSocket = require("ws");
const logBus = require("../bus/logBus");

const jobClients = new Map();

function broadcast(jobId, payload) {

  const clients = jobClients.get(jobId);

  if (!clients) return;

  const message = JSON.stringify(payload);

  for (const ws of clients) {

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }

  }

}

function startWebSocket(server) {

  const wss = new WebSocket.Server({ server });

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

      ws.on("close", () => {

        const clients = jobClients.get(jobId);

        if (!clients) return;

        clients.delete(ws);

        if (clients.size === 0) {
          jobClients.delete(jobId);
        }

      });

      ws.on("error", () => {
        ws.close();
      });

    } catch (err) {

      console.error("WebSocket connection error:", err);
      ws.close();

    }

  });

  // single heartbeat timer
  setInterval(() => {

    wss.clients.forEach((ws) => {

      if (ws.readyState === WebSocket.OPEN) {

        try {
          ws.ping();
        } catch {}

      }

    });

  }, 30000);

  logBus.on("log", event => {

    if (!event.jobId) return;

    broadcast(event.jobId, {
      type: "log",
      jobId: event.jobId,
      message: event.message,
      ts: event.ts
    });

  });

  logBus.on("status", event => {

    if (!event.jobId) return;

    broadcast(event.jobId, {
      type: "status",
      jobId: event.jobId,
      status: event.status,
      progress: event.progress,
      ts: event.ts
    });

  });

  console.log("WebSocket server started");

}

module.exports = startWebSocket;