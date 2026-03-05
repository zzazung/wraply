const Redis = require("ioredis");

describe("Redis Log Bus", () => {

  test("publish/subscribe works", async () => {

    const pub = new Redis();
    const sub = new Redis();

    await sub.subscribe("wraply:logs");

    const message = { hello: "world" };

    const received = new Promise(resolve => {

      sub.on("message", (_, msg) => {

        resolve(JSON.parse(msg));

      });

    });

    await pub.publish("wraply:logs", JSON.stringify(message));

    const data = await received;

    expect(data.hello).toBe("world");

  });

});