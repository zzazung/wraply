const WebSocket = require("ws");
const Redis = require("ioredis");
const http = require("http");

const { startWebSocket } =
  require("../../wraply-api/websocket");

let server;
let redis;

describe("WebSocket Reconnect", () => {

  beforeAll(done => {

    server = http.createServer();

    startWebSocket(server);

    server.listen(4013, () => {

      redis = new Redis();
      done();

    });

  });

  afterAll(done => {

    redis.disconnect();
    server.close(done);

  });

  test("client reconnect receives messages", done => {

    let ws =
      new WebSocket("ws://localhost:4013?jobId=reconnect_job");

    ws.on("open", () => {

      ws.close();

      setTimeout(() => {

        ws =
          new WebSocket("ws://localhost:4013?jobId=reconnect_job");

        ws.on("message", data => {

          const msg =
            JSON.parse(data);

          expect(msg.message).toBe("reconnect log");

          ws.close();
          done();

        });

        ws.on("open", async () => {

          await redis.publish(
            "wraply:logs",
            JSON.stringify({
              jobId: "reconnect_job",
              message: "reconnect log"
            })
          );

        });

      }, 200);

    });

  });

});