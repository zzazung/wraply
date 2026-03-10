const WebSocket = require("ws");
const Redis = require("ioredis");
const http = require("http");

const {
  startWebSocket,
  closeWebSocket
} = require("../../wraply-api/websocket");

describe("WebSocket reconnect", () => {

  let server;
  let redis;
  let ws;
  const received = [];

  beforeAll(done => {

    server = http.createServer();

    startWebSocket(server);

    server.listen(4020, () => {

      redis = new Redis();
      done();

    });

  });

  afterAll(async () => {

    if (ws) ws.close();

    await closeWebSocket();

    redis.disconnect();

    await new Promise(r =>
      server.close(r)
    );

  });

  test("reconnect after redis interruption", async () => {

    const jobId = "reconnect-test";

    ws = new WebSocket(
      `ws://localhost:4020?jobId=${jobId}`
    );

    await new Promise(resolve =>
      ws.on("open", resolve)
    );

    ws.on("message", data => {

      const msg = JSON.parse(data);

      if (msg.type === "log") {
        received.push(msg.message);
      }

    });

    // wait subscription ready
    await new Promise(r => setTimeout(r, 200));

    await redis.publish(
      "wraply:logs",
      JSON.stringify({
        jobId,
        message: "first"
      })
    );

    await new Promise(r => setTimeout(r, 200));

    await redis.publish(
      "wraply:logs",
      JSON.stringify({
        jobId,
        message: "second"
      })
    );

    await new Promise(r => setTimeout(r, 500));

    expect(received).toContain("first");
    expect(received).toContain("second");

  });

});