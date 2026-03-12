const { query } = require("@wraply/shared/db");
const JOB_STATE = require("@wraply/shared/job/jobState");

/**
 * building 상태에서 오래 멈춘 job 복구
 */

async function recoverStuckJobs() {

  console.log("Checking stuck jobs");

  const rows = await query(`
    SELECT job_id
    FROM jobs
    WHERE status = ?
      AND updated_at < NOW() - INTERVAL 30 MINUTE
  `, [JOB_STATE.BUILDING]);

  if (!rows.length) return;

  for (const job of rows) {

    console.log("Recovering job", job.job_id);

    await query(`
      UPDATE jobs
      SET status = ?
      WHERE job_id = ?
    `, [JOB_STATE.FAILED, job.job_id]);

  }

}

module.exports = recoverStuckJobs;