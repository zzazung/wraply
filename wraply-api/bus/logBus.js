const Redis = require("ioredis");

require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

function subscribeLogs(handler) {

  const sub = new Redis(process.env.REDIS_URL);

  sub.subscribe("wraply:logs");

  sub.on("message", (channel, message) => {

    if (channel !== "wraply:logs") return;

    try {

      const data = JSON.parse(message);

      handler(data);

    } catch (err) {
      console.error("log parse error", err);
    }

  });

}

module.exports = {
  subscribeLogs
};