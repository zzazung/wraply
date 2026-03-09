const express = require("express");
const router = express.Router();
const { requireWorker } = require("../middleware/auth");
const { query } = require("@wraply/shared/db");

router.post("/job/update", requireWorker, async (req, res) => {
  try {

    const { jobId, status } = req.body;

    /**
     * 기본 validation
     */
    if (!jobId || !status) {
      return res.status(400).json({
        error: "jobId and status required"
      });
    }

    if (typeof jobId !== "string") {
      return res.status(400).json({
        error: "invalid jobId"
      });
    }

    if (typeof status !== "string") {
      return res.status(400).json({
        error: "invalid status"
      });
    }

    const allowed = [
      "queued",
      "building",
      "success",
      "failed"
    ];

    if (!allowed.includes(status)) {

      console.warn(
        "Worker invalid status:",
        jobId,
        status
      );

      return res.status(400).json({
        error: "invalid status"
      });
    }

    /**
     * job status update
     */
    const result = await query(
      `UPDATE jobs
       SET status = ?, updated_at = NOW()
       WHERE job_id = ?`,
      [status, jobId]
    );

    /**
     * update 결과 검증
     */
    if (!result || result.affectedRows === 0) {

      console.warn(
        "Worker update skipped (job not found):",
        jobId
      );

      return res.status(404).json({
        error: "job not found"
      });

    }

    console.log(
      "Worker update:",
      jobId,
      "→",
      status
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(
      "internal update error",
      err
    );

    res.status(500).json({
      error: "internal error"
    });

  }
});

module.exports = router;