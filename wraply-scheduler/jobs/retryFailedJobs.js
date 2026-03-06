const { query } = require("@wraply/shared/db");
const { enqueueBuild } = require("@wraply/shared/queue");

async function retryFailedJobs() {

  console.log("Retry failed jobs");

  const rows = await query(`
    SELECT job_id, project_id
    FROM jobs
    WHERE status = 'failed'
    AND retry_count < 3
  `);

  for (const job of rows) {

    console.log("Retry job", job.job_id);

    await enqueueBuild({
      jobId: job.job_id,
      projectId: job.project_id
    });

    await query(`
      UPDATE jobs
      SET retry_count = retry_count + 1
      WHERE job_id = ?
    `, [job.job_id]);

  }

}

module.exports = retryFailedJobs;