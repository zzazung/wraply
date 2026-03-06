// api/websocket.js
const WebSocket = require("ws");
const logBus = require("../bus/logBus");

/*
client 구조

jobClients = {
  jobId: Set<WebSocket>
}
*/
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

// function initWebSocket(server) {
//   const wss = new WebSocket.Server({ server });

//   wss.on("connection", (ws, req) => {
//     const url = new URL(req.url, `http://${req.headers.host}`);
//     const jobId = url.searchParams.get("jobId");

//     if (!jobId) {
//       ws.close();
//       return;
//     }

//     clients.set(ws, jobId);

//     // ✅ 연결 이벤트는 build status와 분리
//     try {
//       ws.send(JSON.stringify({ type: "ws", status: "connected" }));
//     } catch {}

//     ws.on("close", () => {
//       clients.delete(ws);
//     });

//     ws.on("error", () => {
//       clients.delete(ws);
//     });
//   });

//   // heartbeat: 30초마다 ping 보내기 (클라이언트가 끊긴 경우 감지)
//   setInterval(() => {
//     wss.clients.forEach((ws) => {
//       if (ws.readyState !== WebSocket.OPEN) {
//         clients.delete(ws);
//       } else {
//         try {
//           ws.ping();
//         } catch {}
//       }
//     });
//   }, 30000);

//   return wss;
// }

// function broadcastLog(jobId, message) {
//   for (const [ws, clientJobId] of clients.entries()) {
//     if (clientJobId === jobId && ws.readyState === WebSocket.OPEN) {
//       try {
//         ws.send(JSON.stringify({
//           type: "log",
//           data: String(message),
//         }));
//       } catch {}
//     }
//   }
// }

// function broadcastStatus(jobId, payload) {
//   for (const [ws, clientJobId] of clients.entries()) {
//     if (clientJobId === jobId && ws.readyState === WebSocket.OPEN) {
//       try {
//         ws.send(JSON.stringify({
//           type: "status",
//           status: payload.status,
//           progress: payload.progress,
//         }));
//       } catch {}
//     }
//   }
// }

// subscribeLogs((data) => {
//   const { jobId, type, message, status, progress } = data;

//   if (type === "log") {
//     broadcastLog(jobId, message);
//   }

//   if (type === "status") {
//     broadcastStatus(jobId, {
//       status,
//       progress
//     });
//   }
// });

// module.exports = {
//   initWebSocket,
//   broadcastLog,
//   broadcastStatus
// };

function startWebSocket(server) {

  const wss = new WebSocket.Server({ server })

  wss.on("connection", (ws, req) => {

    try {

      const url = new URL(req.url, "http://localhost")

      const jobId = url.searchParams.get("jobId")

      if (!jobId) {
        ws.close()
        return
      }

      if (!jobClients.has(jobId)) {
        jobClients.set(jobId, new Set())
      }

      jobClients.get(jobId).add(ws)

      ws.on("close", () => {

        const clients = jobClients.get(jobId)

        if (!clients) return

        clients.delete(ws)

        if (clients.size === 0) {
          jobClients.delete(jobId)
        }

      })

      ws.on("error", () => {
        ws.close()
      })

      // heartbeat: 30초마다 ping 보내기 (클라이언트가 끊긴 경우 감지)
      setInterval(() => {
        wss.clients.forEach((ws) => {
          if (ws.readyState !== WebSocket.OPEN) {
            jobClients.delete(ws);
          } else {
            try {
              ws.ping();
            } catch {}
          }
        });
      }, 30000);

    } catch (err) {

      console.error("WebSocket connection error:", err)
      ws.close()

    }

  })

  /*
  Redis log event
  */

  logBus.on("log", event => {

    if (!event.jobId) return

    broadcast(event.jobId, {
      type: "log",
      jobId: event.jobId,
      message: event.message,
      ts: event.ts
    })

  })

  /*
  Redis status event
  */

  logBus.on("status", event => {

    if (!event.jobId) return

    broadcast(event.jobId, {
      type: "status",
      jobId: event.jobId,
      status: event.status,
      progress: event.progress,
      ts: event.ts
    })

  })

  console.log("WebSocket server started")

}

module.exports = startWebSocket;
