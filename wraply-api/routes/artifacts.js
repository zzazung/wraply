const express = require("express");

const db = require("@wraply/shared/db");
const artifactStorage =
  require("@wraply/shared/storage/artifactStorage");

const {
  createSignedToken,
  verifySignedToken
} = require("@wraply/shared/security/signedUrl");

const router = express.Router();



/**
 * artifact list
 */
router.get("/:jobId", async (req, res) => {

  try {

    const { jobId } = req.params;

    const rows = await db.query(
      "SELECT * FROM jobs WHERE job_id=?",
      [jobId]
    );

    const job = rows[0];

    if (!job) {
      return res.status(404).json({
        error: "job not found"
      });
    }

    const files =
      await artifactStorage.list(jobId);

    const items = files.map(file => {

      const token =
        createSignedToken({
          jobId,
          file,
          ttl: 600000
        });

      return {
        file,
        download:
          `/artifacts/download?token=${token}`
      };

    });

    res.json({
      jobId,
      items
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "artifact list failed"
    });

  }

});



/**
 * artifact download (signed)
 */
router.get("/download", async (req, res) => {

  try {

    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: "token required"
      });
    }

    const payload =
      verifySignedToken(token);

    if (!payload) {
      return res.status(403).json({
        error: "invalid token"
      });
    }

    const stream =
      await artifactStorage.getStream(
        payload.jobId,
        payload.file
      );

    if (!stream) {
      return res.status(404).json({
        error: "artifact not found"
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${payload.file}"`
    );

    stream.pipe(res);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "artifact download failed"
    });

  }

});

module.exports = router;