// api/websocket.js
const WebSocket = require("ws");
const { query } = require("wraply-shared/db")

const clients = new Map(); // ws -> jobId

async function recoverJobs() {

  await query(`
    UPDATE jobs
    SET status='failed'
    WHERE status='running'
  `);

}

async function start() {

  await recoverJobs();

  startConsumer();

}

start();

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const jobId = url.searchParams.get("jobId");

    if (!jobId) {
      ws.close();
      return;
    }

    clients.set(ws, jobId);

    // ✅ 연결 이벤트는 build status와 분리
    try {
      ws.send(JSON.stringify({ type: "ws", status: "connected" }));
    } catch {}

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  return wss;
}

function broadcastLog(jobId, message) {
  for (const [ws, clientJobId] of clients.entries()) {
    if (clientJobId === jobId && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: "log",
          data: String(message),
        }));
      } catch {}
    }
  }
}

function broadcastStatus(jobId, payload) {
  for (const [ws, clientJobId] of clients.entries()) {
    if (clientJobId === jobId && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: "status",
          status: payload.status,
          progress: payload.progress,
        }));
      } catch {}
    }
  }
}

module.exports = { initWebSocket, broadcastLog, broadcastStatus };