require("dotenv").config();

const { startCancelListener } = require("./bus/cancelBus");

async function start() {

  try {

    console.log("[wraply-worker] starting worker");

    // start build queue consumer
    require("./queue/buildConsumer");

    console.log("[wraply-worker] build consumer started");

    // start cancel listener
    await startCancelListener();

  } catch (err) {

    console.error("[wraply-worker] startup error", err);

    process.exit(1);

  }

}

async function shutdown() {

  try {

    console.log("[wraply-worker] shutting down");

    process.exit(0);

  } catch (err) {

    console.error("[wraply-worker] shutdown error", err);

    process.exit(1);

  }

}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("uncaughtException", err => {

  console.error("[wraply-worker] uncaughtException", err);

});

process.on("unhandledRejection", err => {

  console.error("[wraply-worker] unhandledRejection", err);

});

start();