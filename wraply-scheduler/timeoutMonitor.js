const { query } = require("@wraply/shared/db");
const Redis = require("ioredis");

const redis = new Redis(
  process.env.REDIS_URL ||
  "redis://127.0.0.1:6379"
);

const CHECK_INTERVAL = 30000;

async function checkTimeoutJobs() {

  try {

    const rows = await query(
      `
      SELECT job_id, timeout_sec
      FROM jobs
      WHERE status NOT IN ('finished','failed')
      AND created_at < NOW() - INTERVAL timeout_sec SECOND
      `
    );

    for (const job of rows) {

      console.log("timeout job detected:", job.job_id);

      await redis.publish(
        "wraply:cancel",
        JSON.stringify({
          jobId: job.job_id,
          reason: "timeout"
        })
      );

      await query(
        `
        UPDATE jobs
        SET
          status='failed',
          error_reason='build timeout'
        WHERE job_id=?
        `,
        [job.job_id]
      );

    }

  } catch (err) {

    console.error("timeout monitor error:", err);

  }

}

setInterval(checkTimeoutJobs, CHECK_INTERVAL);

console.log("timeout monitor started");