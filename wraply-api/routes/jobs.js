// api/routes/jobs.js

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const { query } = require("@wraply/shared/db");

require("dotenv").config();

const router = express.Router();

const CI_ROOT = process.env.CI_ROOT || process.cwd();

/**
 * 안전한 CI_ROOT 내부 경로만 허용
 */
function safeAbsPathFromCiRoot(relPath) {

  if (!relPath) return null;

  const normalized = relPath.replace(/\\/g, "/");

  if (normalized.includes(".."))
    return null;

  const abs = path.resolve(CI_ROOT, normalized);

  if (!abs.startsWith(path.resolve(CI_ROOT)))
    return null;

  return abs;

}

function rmrf(absPath) {

  try {

    if (absPath && fs.existsSync(absPath)) {

      fs.rmSync(absPath, {
        recursive: true,
        force: true
      });

      return true;

    }

  } catch (err) {

    console.error("rmrf error:", err);

  }

  return false;

}

/**
 * Job 생성
 */
router.post("/", async (req, res) => {

  try {

    const {
      projectId,
      platform,
      packageName,
      appName,
      url,
      scheme
    } = req.body;

    if (
      typeof projectId !== "string" ||
      typeof platform !== "string" ||
      typeof packageName !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid fields"
      });
    }

    const jobId = `job_${uuidv4()}`;
    const safeName = packageName.replace(/\./g, "_");

    await query(
      `
      INSERT INTO jobs
      (
        job_id,
        project_id,
        platform,
        package_name,
        safe_name,
        app_name,
        url,
        scheme,
        status,
        progress,
        worker_id,
        build_host
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, NULL, NULL)
      `,
      [
        jobId,
        projectId,
        platform,
        packageName,
        safeName,
        appName || null,
        url || null,
        scheme || null
      ]
    );

    res.json({
      success: true,
      jobId
    });

  } catch (e) {

    console.error("job create error:", e);

    res.status(500).json({
      error: String(e)
    });

  }

});

/**
 * Job History
 */
router.get("/", async (req, res) => {

  try {

    const rows = await query(
      `
      SELECT
        job_id,
        project_id,
        platform,
        package_name,
        safe_name,
        app_name,
        url,
        scheme,
        status,
        progress,
        worker_id,
        build_host,
        created_at,
        updated_at,
        finished_at,
        error_reason
      FROM jobs
      ORDER BY created_at DESC
      LIMIT 100
      `
    );

    res.json({ items: rows });

  } catch (err) {

    console.error("job list error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Job Detail
 */
router.get("/:jobId", async (req, res) => {

  try {

    const { jobId } = req.params;

    const rows = await query(
      `SELECT * FROM jobs WHERE job_id=? LIMIT 1`,
      [jobId]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Job not found"
      });
    }

    res.json(rows[0]);

  } catch (err) {

    console.error("job detail error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Job Log
 */
router.get("/:jobId/log", async (req, res) => {

  try {

    const { jobId } = req.params;

    const rows = await query(
      `SELECT log_path FROM jobs WHERE job_id=?`,
      [jobId]
    );

    if (!rows.length || !rows[0].log_path)
      return res.status(404).json({ error: "Log not found" });

    const logPath = rows[0].log_path;

    const abs = path.isAbsolute(logPath)
      ? logPath
      : path.join(CI_ROOT, logPath);

    if (!fs.existsSync(abs))
      return res.status(404).json({ error: "Log file missing" });

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    fs.createReadStream(abs).pipe(res);

  } catch (err) {

    console.error("log read error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Job Artifacts
 */
router.get("/:jobId/artifacts", async (req, res) => {

  try {

    const { jobId } = req.params;

    const rows = await query(
      `
      SELECT
        id,
        platform,
        name,
        path,
        size,
        created_at
      FROM artifacts
      WHERE job_id=?
      `,
      [jobId]
    );

    const items = rows
      .filter(r => r.path && !r.path.includes(".."))
      .map(r => ({
        id: r.id,
        platform: r.platform,
        name: r.name,
        downloadUrl: `/downloads/${r.path}`,
        size: r.size,
        createdAt: r.created_at
      }));

    res.json({ items });

  } catch (err) {

    console.error("artifact list error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Job Cancel
 */
router.post("/:jobId/cancel", async (req, res) => {

  try {

    const { jobId } = req.params;

    const rows = await query(
      `SELECT status FROM jobs WHERE job_id=?`,
      [jobId]
    );

    if (!rows.length)
      return res.status(404).json({ error: "Job not found" });

    const { isTerminal } =
      require("@wraply/shared/job/jobState");

    if (isTerminal(rows[0].status))
      return res.status(400).json({ error: "Job already finished" });

    const redis = require("../lib/redis");

    await redis.publish(
      "wraply:cancel",
      JSON.stringify({ jobId })
    );

    res.json({ success: true });

  } catch (err) {

    console.error("job cancel error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Job Delete
 */
router.delete("/", async (req, res) => {

  const jobIds = Array.isArray(req.body?.jobIds)
    ? req.body.jobIds
    : [];

  if (!jobIds.length)
    return res.status(400).json({ error: "jobIds is required" });

  try {

    const placeholders = jobIds.map(() => "?").join(",");

    const rows = await query(
      `
      SELECT job_id, artifact_dir, log_path
      FROM jobs
      WHERE job_id IN (${placeholders})
      `,
      jobIds
    );

    const deletedFiles = [];

    for (const r of rows) {

      const artifactAbs =
        safeAbsPathFromCiRoot(r.artifact_dir);

      const logAbs =
        safeAbsPathFromCiRoot(r.log_path);

      if (artifactAbs && rmrf(artifactAbs))
        deletedFiles.push({ jobId: r.job_id });

      if (logAbs && rmrf(logAbs))
        deletedFiles.push({ jobId: r.job_id });

    }

    const delJobs = await query(
      `
      DELETE FROM jobs
      WHERE job_id IN (${placeholders})
      `,
      jobIds
    );

    res.json({
      success: true,
      deletedCount: delJobs.affectedRows ?? 0,
      deletedFiles
    });

  } catch (err) {

    console.error("job delete error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

module.exports = router;