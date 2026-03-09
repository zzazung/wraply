const Redis = require("ioredis");

async function capture(channel) {

  const sub = new Redis();

  await sub.subscribe(channel);

  return new Promise(resolve => {

    sub.on("message", (_, message) => {

      resolve(JSON.parse(message));

    });

  });

}

module.exports = { capture };