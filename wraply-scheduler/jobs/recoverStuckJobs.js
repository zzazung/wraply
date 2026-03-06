const { query } = require("@wraply/shared/db");

/**
 * building 상태에서 오래 멈춘 job 복구
 */
async function recoverStuckJobs() {

  console.log("Checking stuck jobs");

  const rows = await query(`
    SELECT job_id
    FROM jobs
    WHERE status = 'building'
    AND updated_at < NOW() - INTERVAL 30 MINUTE
  `);

  for (const job of rows) {

    console.log("Recovering job", job.job_id);

    await query(`
      UPDATE jobs
      SET status = 'failed'
      WHERE job_id = ?
    `, [job.job_id]);

  }

}

module.exports = recoverStuckJobs;