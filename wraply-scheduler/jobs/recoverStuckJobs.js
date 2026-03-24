const { query, queryWithTenant } = require("@wraply/shared/db");

async function recoverStuckJobs() {

  const rows = await query(`
    SELECT job_id, tenant_id
    FROM jobs
    WHERE status IN ('preparing','building')
      AND heartbeat_at < NOW() - INTERVAL 5 MINUTE
  `);

  for (const job of rows) {

    console.log("[scheduler] recover stuck job:", job.job_id);

    await queryWithTenant(
      job.tenant_id,
      `
      UPDATE jobs
      SET status='failed', updated_at=NOW()
      WHERE job_id=?
      `,
      [job.job_id]
    );

  }

}

module.exports = { recoverStuckJobs };