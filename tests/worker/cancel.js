const Redis = require("ioredis");

describe("Cancel", () => {

  test("cancel publish", async () => {

    const pub = new Redis();
    const sub = new Redis();

    await sub.subscribe("wraply:cancel");

    let received;

    sub.on("message", (_, msg) => {

      received = JSON.parse(msg);

    });

    await pub.publish(
      "wraply:cancel",
      JSON.stringify({ jobId: "ci-job" })
    );

    await new Promise(r => setTimeout(r, 100));

    expect(received.jobId).toBe("ci-job");

  });

});