const WebSocket = require("ws");
const Redis = require("ioredis");
const http = require("http");

const { startWebSocket } =
  require("../../wraply-api/websocket");

let server;
let redis;

describe("WebSocket Multi Client", () => {

  beforeAll(done => {

    server = http.createServer();

    startWebSocket(server);

    server.listen(4012, () => {

      redis = new Redis();
      done();

    });

  });

  afterAll(done => {

    redis.disconnect();
    server.close(done);

  });

  test("broadcast to multiple clients", done => {

    let received = 0;

    const checkDone = () => {

      received++;

      if (received === 2) done();

    };

    const ws1 =
      new WebSocket("ws://localhost:4012?jobId=multi_job");

    const ws2 =
      new WebSocket("ws://localhost:4012?jobId=multi_job");

    ws1.on("message", () => {

      ws1.close();
      checkDone();

    });

    ws2.on("message", () => {

      ws2.close();
      checkDone();

    });

    ws1.on("open", async () => {

      await new Promise(r => setTimeout(r, 100));

      await redis.publish(
        "wraply:logs",
        JSON.stringify({
          jobId: "multi_job",
          message: "broadcast test"
        })
      );

    });

  });

});