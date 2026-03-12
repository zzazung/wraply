// api/routes/internal.js

const express = require("express");
const { query } = require("@wraply/shared/db");
const { requireWorker } = require("../middleware/auth");

const router = express.Router();

router.use(requireWorker);

/**
 * Worker start build
 */
router.post("/build/start", async (req, res) => {

  try {

    const { jobId, workerId, buildHost } = req.body;

    await query(
      `
      UPDATE jobs
      SET
        worker_id=?,
        build_host=?,
        status='preparing'
      WHERE job_id=?
      `,
      [workerId, buildHost, jobId]
    );

    res.json({ success: true });

  } catch (err) {

    console.error("worker start error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Worker finish
 */
router.post("/build/finish", async (req, res) => {

  try {

    const { jobId, status } = req.body;

    await query(
      `
      UPDATE jobs
      SET
        status=?,
        finished_at=NOW()
      WHERE job_id=?
      `,
      [status, jobId]
    );

    res.json({ success: true });

  } catch (err) {

    console.error("worker finish error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

module.exports = router;