const { startCron } = require("./cron/cronRunner");

async function startScheduler() {

  console.log("Wraply Scheduler Starting");

  startCron();

}

startScheduler();