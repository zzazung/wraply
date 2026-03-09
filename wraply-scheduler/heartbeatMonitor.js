const { query } = require("@wraply/shared/db");
const Redis = require("ioredis");

const redis = new Redis(
  process.env.REDIS_URL ||
  "redis://127.0.0.1:6379"
);

const HEARTBEAT_TIMEOUT = 60;

async function checkStuckJobs() {

  try {

    const rows = await query(
      `
      SELECT job_id, retry_count, max_retry
      FROM jobs
      WHERE status NOT IN ('finished','failed')
      AND heartbeat_at IS NOT NULL
      AND heartbeat_at < NOW() - INTERVAL ? SECOND
      `,
      [HEARTBEAT_TIMEOUT]
    );

    for (const job of rows) {

      console.log("stuck job detected:", job.job_id);

      if (job.retry_count < job.max_retry) {

        console.log("retry job:", job.job_id);

        await query(
          `
          UPDATE jobs
          SET
            status='queued',
            retry_count = retry_count + 1
          WHERE job_id=?
          `,
          [job.job_id]
        );

        await redis.lpush(
          "bull:wraply-build:wait",
          JSON.stringify({ jobId: job.job_id })
        );

      } else {

        console.log("job failed:", job.job_id);

        await query(
          `
          UPDATE jobs
          SET
            status='failed',
            error_reason='worker timeout'
          WHERE job_id=?
          `,
          [job.job_id]
        );

      }

    }

  } catch (err) {

    console.error("heartbeat monitor error:", err);

  }

}

setInterval(checkStuckJobs, 30000);

console.log("heartbeat monitor started");