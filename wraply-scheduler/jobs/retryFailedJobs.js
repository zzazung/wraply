const { query } = require("@wraply/shared/db");
const { enqueueBuild } = require("@wraply/shared/queue");
const { STATES } = require("@wraply/shared/job/jobState");

async function retryFailedJobs() {

  console.log("Retry failed jobs");

  const rows = await query(`
    SELECT job_id, project_id
    FROM jobs
    WHERE status = ?
      AND retry_count < max_retry
  `, [STATES.FAILED]);

  if (!rows || rows.length === 0) return;

  for (const job of rows) {

    console.log("Retry job", job.job_id);

    await enqueueBuild({
      jobId: job.job_id,
      projectId: job.project_id
    });

    await query(`
      UPDATE jobs
      SET
        status = ?,
        retry_count = retry_count + 1,
        updated_at = NOW()
      WHERE job_id = ?
    `, [STATES.QUEUED, job.job_id]);

  }

}

module.exports = {
  retryFailedJobs
};