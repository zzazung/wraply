const express = require("express");
const fs = require("fs");
const path = require("path");

const { query } = require("@wraply/shared/db");

const router = express.Router();

const ARTIFACT_ROOT =
  process.env.ARTIFACT_DIR ||
  path.join(process.cwd(), "artifacts");


/**
 * artifact list
 */
router.get("/:jobId", async (req, res) => {

  try {

    const { jobId } = req.params;

    const rows = await query(
      "SELECT * FROM jobs WHERE job_id=?",
      [jobId]
    );

    const job = rows[0];

    if (!job) {
      return res.status(404).json({
        error: "job not found"
      });
    }

    const dir =
      path.join(ARTIFACT_ROOT, jobId);

    if (!fs.existsSync(dir)) {
      return res.json({
        items: []
      });
    }

    const files =
      fs.readdirSync(dir)
        .filter(f => !f.includes(".."));

    res.json({
      jobId,
      files
    });

  } catch (err) {

    console.error(
      "artifact list error:",
      err
    );

    res.status(500).json({
      error: "internal error"
    });

  }

});


/**
 * artifact download
 */
router.get("/:jobId/:file", async (req, res) => {

  try {

    const { jobId, file } = req.params;

    /**
     * filename sanitize
     */
    if (
      file.includes("..") ||
      file.includes("/") ||
      file.includes("\\")
    ) {
      return res.status(400).json({
        error: "invalid filename"
      });
    }

    const rows = await query(
      "SELECT job_id FROM jobs WHERE job_id=?",
      [jobId]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "job not found"
      });
    }

    const filePath =
      path.join(
        ARTIFACT_ROOT,
        jobId,
        file
      );

    const normalized =
      path.normalize(filePath);

    if (
      !normalized.startsWith(
        path.join(ARTIFACT_ROOT, jobId)
      )
    ) {
      return res.status(400).json({
        error: "invalid path"
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "artifact not found"
      });
    }

    /**
     * content type
     */
    if (file.endsWith(".apk")) {
      res.setHeader(
        "Content-Type",
        "application/vnd.android.package-archive"
      );
    }

    if (file.endsWith(".ipa")) {
      res.setHeader(
        "Content-Type",
        "application/octet-stream"
      );
    }

    res.download(filePath);

  } catch (err) {

    console.error(
      "artifact download error:",
      err
    );

    res.status(500).json({
      error: "internal error"
    });

  }

});

module.exports = router;