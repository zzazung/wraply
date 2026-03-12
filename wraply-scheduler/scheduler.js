const { startCron } = require("./cron/cronRunner");
const { startWatchdog, startHeartbeatListener } = require("./watchdog/buildWatchdog");

async function startScheduler() {

  console.log("Wraply scheduler started");

  startCron();

  await startHeartbeatListener();

  startWatchdog();

}

startScheduler();