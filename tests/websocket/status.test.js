const WebSocket = require("ws");
const Redis = require("ioredis");
const http = require("http");

const { startWebSocket } =
  require("../../wraply-api/websocket");

let server;
let redis;

describe("WebSocket Status Streaming", () => {

  beforeAll(done => {

    server = http.createServer();

    startWebSocket(server);

    server.listen(4011, () => {

      redis = new Redis();
      done();

    });

  });

  afterAll(done => {

    redis.disconnect();
    server.close(done);

  });

  test("receive status update", done => {

    const ws =
      new WebSocket("ws://localhost:4011?jobId=status_job");

    ws.on("message", data => {

      const msg = JSON.parse(data);

      expect(msg.type).toBe("status");
      expect(msg.jobId).toBe("status_job");
      expect(msg.status).toBe("building");
      expect(msg.progress).toBe(50);

      ws.close();
      done();

    });

    ws.on("open", async () => {

      await new Promise(r => setTimeout(r, 100));

      await redis.publish(
        "wraply:status",
        JSON.stringify({
          jobId: "status_job",
          status: "building",
          progress: 50
        })
      );

    });

  });

});