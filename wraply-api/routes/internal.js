const express = require("express");
const router = express.Router();
const { requireWorker } = require("../middleware/auth");
const { query } = require("@wraply/shared/db");

router.post("/job/update", requireWorker, async (req, res) => {
  try {
    const { jobId, status } = req.body;

    if (!jobId || !status) {
      return res.status(400).json({
        error: "jobId and status required"
      });
    }

    const allowed = ["queued", "building", "success", "failed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: "invalid status"
      });
    }

    await query(
      `UPDATE jobs
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, jobId]
    );

    console.log("Worker update:", jobId, status);

    res.json({
      success: true
    });

  } catch (err) {
    console.error("internal update error", err);

    res.status(500).json({
      error: "internal error"
    });
  }
});

module.exports = router;