const http = require("http");
require("dotenv").config();

const app = require("./app");
const { startWebSocket } = require("./websocket");

const PORT =
  Number(process.env.API_PORT || 4000);

const server =
  http.createServer(app);

if (process.env.NODE_ENV !== "test") {
    startWebSocket(server);
}

server.listen(PORT, () => {

  console.log(`✅ Wraply API running on ${PORT}`);

});

module.exports = server;