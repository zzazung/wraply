// wraply-api/routes/jobs.js

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const { query } = require("@wraply/shared/db");
const { enqueueBuild } = require("../queue/buildQueue");
const { CANCEL_CHANNEL } = require("@wraply/shared/constants/queues");

const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

if (!process.env.CI_ROOT) {
  throw new Error("CI_ROOT is required")
}

const CI_ROOT = process.env.CI_ROOT;

/**
 * 안전한 CI_ROOT 내부 경로만 허용
 */
function safeAbsPathFromCiRoot(relPath) {

  if (!relPath) return null;

  const normalized = relPath.replace(/\\/g, "/");

  if (normalized.includes("..")) return null;

  const abs = path.resolve(CI_ROOT, normalized);

  if (!abs.startsWith(path.resolve(CI_ROOT))) return null;

  return abs;

}

function rmrf(absPath) {

  try {

    if (absPath && fs.existsSync(absPath)) {

      fs.rmSync(absPath, { recursive: true, force: true });

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

    const { tenantId } = req.user;

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
      return res.status(400).json({ error: "Invalid fields" });
    }

    /**
     * 🔥 project 소유권 검증
     */
    const projectRows = await query(
      `
      SELECT id
      FROM projects
      WHERE id = ?
      AND tenant_id = ?
      LIMIT 1
      `,
      [projectId, tenantId]
    );

    if (!projectRows.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    const jobId = uuidv4();
    const safeName = packageName.replace(/\./g, "_");

    await query(
      `
      INSERT INTO jobs (
        job_id,
        tenant_id,
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
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, NULL, NULL, NOW(), NOW())
      `,
      [
        jobId,
        tenantId,
        projectId,
        platform,
        packageName,
        safeName,
        appName || null,
        url || null,
        scheme || null
      ]
    );

    await enqueueBuild({
      jobId,
      tenantId,
      projectId,
      platform,
      packageName,
      safeName,
      appName,
      url
    });

    res.json({ success: true, jobId });

  } catch (e) {

    console.error("job create error:", e);

    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Job History
 */
router.get("/", async (req, res) => {

  try {

    const { tenantId } = req.user;

    const rows = await query(
      `
      SELECT
        job_id,
        tenant_id,
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
        error_reason,
        log_path,
        artifact_dir
      FROM jobs
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [tenantId]
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

    const { tenantId } = req.user;

    const rows = await query(
      `
      SELECT *
      FROM jobs
      WHERE job_id = ?
      AND tenant_id = ?
      LIMIT 1
      `,
      [req.params.jobId, tenantId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Job not found" });
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

    const { tenantId } = req.user;

    const rows = await query(
      `
      SELECT log_path
      FROM jobs
      WHERE job_id = ?
      AND tenant_id = ?
      LIMIT 1
      `,
      [req.params.jobId, tenantId]
    );

    if (!rows.length || !rows[0].log_path) {
      return res.status(404).json({ error: "Log not found" });
    }

    const abs = safeAbsPathFromCiRoot(rows[0].log_path);
    console.log(abs);

    if (!abs || !fs.existsSync(abs)) {
      return res.status(404).json({ error: "Log file missing" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

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

    const { tenantId } = req.user;

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
      WHERE job_id = ?
      AND tenant_id = ?
      `,
      [req.params.jobId, tenantId]
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

    const { tenantId } = req.user;

    const rows = await query(
      `
      SELECT status
      FROM jobs
      WHERE job_id = ?
      AND tenant_id = ?
      LIMIT 1
      `,
      [req.params.jobId, tenantId]
    );

    if (!rows.length)
      return res.status(404).json({ error: "Job not found" });

    const { isTerminal } =
      require("@wraply/shared/job/jobState");

    if (isTerminal(rows[0].status))
      return res.status(400).json({ error: "Job already finished" });

    const redis = require("../lib/redis");

    await redis.publish(
      CANCEL_CHANNEL,
      JSON.stringify({
        jobId: req.params.jobId,
        tenantId
      })
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

  try {

    const { tenantId } = req.user;

    const jobIds = Array.isArray(req.body?.jobIds)
      ? req.body.jobIds
      : [];

    if (!jobIds.length)
      return res.status(400).json({ error: "jobIds is required" });

    const placeholders = jobIds.map(() => "?").join(",");

    const rows = await query(
      `
      SELECT job_id, artifact_dir, log_path
      FROM jobs
      WHERE tenant_id = ?
      AND job_id IN (${placeholders})
      `,
      [tenantId, ...jobIds]
    );

    const deletedFiles = [];

    for (const job of rows) {

      const artifactAbs = safeAbsPathFromCiRoot(job.artifact_dir);
      const logAbs = safeAbsPathFromCiRoot(job.log_path);

      if (artifactAbs && rmrf(artifactAbs))
        deletedFiles.push({ jobId: job.job_id });

      if (logAbs && rmrf(logAbs))
        deletedFiles.push({ jobId: job.job_id });

    }

    const result = await query(
      `
      DELETE FROM jobs
      WHERE tenant_id = ?
      AND job_id IN (${placeholders})
      `,
      [tenantId, ...jobIds]
    );

    res.json({
      success: true,
      deletedCount: result.affectedRows || 0,
      deletedFiles
    });

  } catch (err) {

    console.error("job delete error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

module.exports = router;