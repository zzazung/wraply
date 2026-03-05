// api/websocket.js
const WebSocket = require("ws");

const { subscribeLogs } = require("../bus/logBus");

const clients = new Map(); // ws -> jobId

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

    ws.on("error", () => {
      clients.delete(ws);
    });
  });

  // heartbeat: 30초마다 ping 보내기 (클라이언트가 끊긴 경우 감지)
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState !== WebSocket.OPEN) {
        clients.delete(ws);
      } else {
        try {
          ws.ping();
        } catch {}
      }
    });
  }, 30000);

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

subscribeLogs((data) => {
  const { jobId, type, message, status, progress } = data;

  if (type === "log") {
    broadcastLog(jobId, message);
  }

  if (type === "status") {
    broadcastStatus(jobId, {
      status,
      progress
    });
  }
});

module.exports = {
  initWebSocket,
  broadcastLog,
  broadcastStatus
};