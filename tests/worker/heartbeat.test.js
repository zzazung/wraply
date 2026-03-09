const Redis = require("ioredis");

describe("Heartbeat", () => {

  test("publish heartbeat", async () => {

    const pub = new Redis();
    const sub = new Redis();

    await sub.subscribe("wraply:heartbeat");

    let received;

    sub.on("message", (_, msg) => {

      received = JSON.parse(msg);

    });

    await pub.publish(
      "wraply:heartbeat",
      JSON.stringify({
        jobId: "ci-job",
        ts: Date.now()
      })
    );

    await new Promise(r => setTimeout(r, 100));

    expect(received.jobId).toBe("ci-job");

  });

});