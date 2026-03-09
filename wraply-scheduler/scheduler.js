const { startCron } = require("./cron/cronRunner");
const recoverStuckJobs = require("./jobs/recoverStuckJobs");
const { startWatchdog, startHeartbeatListener } = require("./watchdog/buildWatchdog");

async function startScheduler() {

  console.log("Wraply scheduler started");

  startCron();

  await startHeartbeatListener();

  startWatchdog();

  setInterval(async () => {

    try {

      await recoverStuckJobs();

    } catch (err) {

      console.error("recoverStuckJobs error:", err);

    }

  }, 60000);

}

startScheduler();