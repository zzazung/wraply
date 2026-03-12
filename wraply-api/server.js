const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

// require("dotenv").config({
//   path: path.resolve(process.cwd(), ".env")
// });

// console.log(path.resolve(process.cwd(), ".env"));

const http = require("http");
const app = require("./app");
const { startWebSocket } = require("./websocket");

const PORT = Number(process.env.API_PORT || 4000);

const server = http.createServer(app);

let wsInstance = null;

/**
 * WebSocket start (test 환경 제외)
 */
if (process.env.NODE_ENV !== "test") {

  wsInstance = startWebSocket(server);

}

/**
 * server start
 */
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`✅ Wraply API running on ${PORT}`);
  });
}

/**
 * graceful shutdown
 */
async function shutdown() {

  console.log("Wraply API shutting down...");

  try {

    if (wsInstance && wsInstance.close) {
      await wsInstance.close();
    }

  } catch (err) {

    console.error("WebSocket shutdown error:", err);

  }

  server.close(() => {

    console.log("HTTP server closed");

    process.exit(0);

  });

}

/**
 * process signals
 */
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/**
 * unhandled errors
 */
process.on("unhandledRejection", err => {

  console.error("Unhandled Rejection:", err);

});

process.on("uncaughtException", err => {

  console.error("Uncaught Exception:", err);

});

module.exports = server;