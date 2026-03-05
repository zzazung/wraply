const Redis = require("ioredis-mock");

describe("Redis Log Bus", () => {

  test("publish/subscribe", async () => {

    const pub = new Redis();
    const sub = new Redis();

    await sub.subscribe("wraply:logs");

    const message = { hello: "world" };

    const promise = new Promise(resolve => {

      sub.on("message", (_, msg) => {

        resolve(JSON.parse(msg));

      });

    });

    await pub.publish(
      "wraply:logs",
      JSON.stringify(message)
    );

    const data = await promise;

    expect(data.hello).toBe("world");

  });

});