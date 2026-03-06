const cron = require("node-cron");

const retryFailedJobs = require("../jobs/retryFailedJobs");
const cleanupArtifacts = require("../jobs/cleanupArtifacts");
const recoverStuckJobs = require("../jobs/recoverStuckJobs");

function startCron() {

  console.log("Scheduler Cron Started");

  cron.schedule("*/1 * * * *", async () => {

    await recoverStuckJobs();

  });

  cron.schedule("*/5 * * * *", async () => {

    await retryFailedJobs();

  });

  cron.schedule("0 * * * *", async () => {

    await cleanupArtifacts();

  });

}

module.exports = { startCron };