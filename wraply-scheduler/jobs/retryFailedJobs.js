const { query, queryWithTenant } = require("@wraply/shared/db");
const { enqueueBuild } = require("@wraply/shared/queue");

async function retryFailedJobs() {

  const rows = await query(`
    SELECT job_id, tenant_id, retry_count, max_retry
    FROM jobs
    WHERE status='failed'
  `);

  for (const job of rows) {

    if (job.retry_count >= job.max_retry) continue;

    console.log("[scheduler] retry job:", job.job_id);

    await queryWithTenant(
      job.tenant_id,
      `
      UPDATE jobs
      SET status='queued',
          retry_count=retry_count+1,
          updated_at=NOW()
      WHERE job_id=?
      `,
      [job.job_id]
    );

    await enqueueBuild({
      jobId: job.job_id,
      tenantId: job.tenant_id
    });

  }

}

module.exports = { retryFailedJobs };