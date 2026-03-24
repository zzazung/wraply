// wraply-worker/worker.js

const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const { startCancelListener } = require("./bus/cancelBus");

/* --------------------------------------------------
   Worker Instances
-------------------------------------------------- */

let buildWorker = null;
let aiWorker = null;

/* --------------------------------------------------
   Start
-------------------------------------------------- */

async function start() {

  try {

    console.log("[wraply-worker] starting worker");

    /* ---------------- build worker ---------------- */

    buildWorker = require("./queue/buildConsumer");
    console.log("[wraply-worker] build consumer started");

    /* ---------------- AI worker ---------------- */

    aiWorker = require("./queue/aiWorker");
    console.log("[wraply-worker] ai worker started");

    /* ---------------- cancel listener ---------------- */

    await startCancelListener();

    console.log("[wraply-worker] all systems ready");

  } catch (err) {

    console.error("[wraply-worker] startup error", err);

    await shutdown(1);

  }

}

/* --------------------------------------------------
   Graceful Shutdown (핵심)
-------------------------------------------------- */

async function shutdown(code = 0) {

  try {

    console.log("[wraply-worker] shutting down...");

    if (buildWorker) {
      await buildWorker.close();
      console.log("[wraply-worker] build worker closed");
    }

    if (aiWorker) {
      await aiWorker.close();
      console.log("[wraply-worker] ai worker closed");
    }

    console.log("[wraply-worker] shutdown complete");

    process.exit(code);

  } catch (err) {

    console.error("[wraply-worker] shutdown error", err);
    process.exit(1);

  }

}

/* --------------------------------------------------
   Signals
-------------------------------------------------- */

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

/* --------------------------------------------------
   Error Handling (중요)
-------------------------------------------------- */

process.on("uncaughtException", async (err) => {

  console.error("[wraply-worker] uncaughtException", err);

  await shutdown(1);

});

process.on("unhandledRejection", async (err) => {

  console.error("[wraply-worker] unhandledRejection", err);

  await shutdown(1);

});

/* --------------------------------------------------
   Boot
-------------------------------------------------- */

start();