const { startCron } = require("./cron/cronRunner");
const recoverStuckJobs = require("./jobs/recoverStuckJobs");

async function startScheduler() {

  console.log("Wraply scheduler started");

  startCron();

  setInterval(async () => {

    try {

      await recoverStuckJobs();

    } catch (err) {

      console.error("recoverStuckJobs error:", err);

    }

  }, 60000);

}

startScheduler();