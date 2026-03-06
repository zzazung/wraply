const Redis = require("ioredis");
const EventEmitter = require("events");

const sub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

class LogBus extends EventEmitter {}

const logBus = new LogBus();

sub.subscribe("wraply:logs");
sub.subscribe("wraply:status");

sub.on("message", (channel, message) => {

  const event = JSON.parse(message);

  if (channel === "wraply:logs") {
    logBus.emit("log", event);
  }

  if (channel === "wraply:status") {
    logBus.emit("status", event);
  }

});

module.exports = logBus;