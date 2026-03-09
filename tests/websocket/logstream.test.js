const WebSocket = require("ws");
const Redis = require("ioredis");
const http = require("http");

const { startWebSocket, closeWebSocket } =
  require("../../wraply-api/websocket");

let server;
let redis;

describe("WebSocket Log Streaming", () => {

  beforeAll(done => {

    server = http.createServer();

    startWebSocket(server);

    server.listen(4010, () => {

      redis = new Redis(process.env.REDIS_URL);

      done();

    });

  });

  afterAll(async () => {

    if (redis) {
      redis.disconnect();
    }

    await closeWebSocket();

    await new Promise(resolve => server.close(resolve));

  });

  test("receive log stream", done => {

    const ws =
      new WebSocket("ws://localhost:4010?jobId=test_job");

    ws.on("message", data => {

      const msg = JSON.parse(data);

      expect(msg.type).toBe("log");
      expect(msg.jobId).toBe("test_job");
      expect(msg.message).toBe("hello log");

      ws.close();
      done();

    });

    ws.on("open", async () => {

      /**
       * Redis subscriber ready 보장
       */
      await new Promise(r => setTimeout(r, 100));

      await redis.publish(
        "wraply:logs",
        JSON.stringify({
          jobId: "test_job",
          message: "hello log"
        })
      );

    });

  });

});