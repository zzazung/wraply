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
      "SELECT job_id FROM jobs WHERE job_id=?",
      [jobId]
    );

    if (!rows.length) {

      return res.status(404).json({
        error: "job not found"
      });

    }

    const dir =
      path.join(ARTIFACT_ROOT, jobId);

    if (!fs.existsSync(dir)) {

      return res.json({
        jobId,
        items: []
      });

    }

    const files =
      fs.readdirSync(dir)
        .filter(f =>
          !f.includes("..") &&
          !f.includes("/") &&
          !f.includes("\\")
        )
        .map(name => ({
          name,
          downloadUrl:
            `/artifacts/${jobId}/${name}`
        }));

    res.json({
      jobId,
      items: files
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

    const resolved =
      path.resolve(filePath);

    const base =
      path.resolve(
        path.join(
          ARTIFACT_ROOT,
          jobId
        )
      );

    if (!resolved.startsWith(base)) {

      return res.status(400).json({
        error: "invalid path"
      });

    }

    if (!fs.existsSync(resolved)) {

      return res.status(404).json({
        error: "artifact not found"
      });

    }

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

    res.download(resolved);

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