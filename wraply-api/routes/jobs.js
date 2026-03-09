// api/routes/jobs.js

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const db = require("@wraply/shared/db");

require("dotenv").config();

const router = express.Router();

const CI_ROOT =
  process.env.CI_ROOT || process.cwd();

const API_BASE =
  process.env.API_BASE ||
  `http://localhost:${process.env.API_PORT || 4000}`;



/**
 * 안전한 CI_ROOT 내부 경로만 허용
 */
function safeAbsPathFromCiRoot(relPath) {

  if (!relPath) return null;

  if (path.isAbsolute(relPath)) return null;

  const normalized =
    relPath.replace(/\\/g, "/");

  if (!normalized.startsWith("builds/"))
    return null;

  if (normalized.includes(".."))
    return null;

  const abs =
    path.join(CI_ROOT, normalized);

  const rel =
    path.relative(CI_ROOT, abs);

  if (
    rel.startsWith("..") ||
    path.isAbsolute(rel)
  )
    return null;

  return abs;

}



function rmrf(absPath) {

  try {

    if (
      absPath &&
      fs.existsSync(absPath)
    ) {

      fs.rmSync(absPath, {
        recursive: true,
        force: true
      });

      return true;

    }

  } catch {}

  return false;

}



/**
 * Job 생성 + 큐 enqueue
 */
router.post("/", async (req, res) => {

  try {

    const {
      platform,
      packageName,
      appName,
      url,
      scheme
    } = req.body;

    if (
      !platform ||
      !packageName ||
      !appName ||
      !url
    ) {
      return res.status(400).json({
        error: "Missing fields"
      });
    }

    const jobId =
      `job_${uuidv4()}`;

    const safeName =
      packageName.replace(/\./g, "_");

    await db.query(
      `
      INSERT INTO jobs
      (job_id, platform, package_name, safe_name, app_name, url, scheme, status, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', 0)
      `,
      [
        jobId,
        platform,
        packageName,
        safeName,
        appName,
        url,
        scheme || null
      ]
    );

    await db.query(
      `
      INSERT INTO job_queue (job_id, status)
      VALUES (?, 'queued')
      ON DUPLICATE KEY UPDATE status='queued'
      `,
      [jobId]
    );

    res.json({
      success: true,
      jobId
    });

  } catch (e) {

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

    const platform =
      (req.query.platform || "").toString();

    const status =
      (req.query.status || "").toString();

    const q =
      (req.query.q || "").toString();

    const page =
      Math.max(
        1,
        parseInt(
          (req.query.page || "1").toString(),
          10
        )
      );

    const limit =
      Math.min(
        100,
        Math.max(
          1,
          parseInt(
            (req.query.limit || "20").toString(),
            10
          )
        )
      );

    const offset =
      (page - 1) * limit;

    const where = [];
    const params = [];

    if (platform) {

      where.push("platform = ?");
      params.push(platform);

    }

    if (status) {

      where.push("status = ?");
      params.push(status);

    }

    if (q) {

      where.push(`
      (job_id LIKE ?
      OR package_name LIKE ?
      OR safe_name LIKE ?
      OR app_name LIKE ?
      OR url LIKE ?)
      `);

      const like = `%${q}%`;

      params.push(
        like,
        like,
        like,
        like,
        like
      );

    }

    const whereSql =
      where.length
        ? `WHERE ${where.join(" AND ")}`
        : "";

    const countRows =
      await db.query(
        `
        SELECT COUNT(*) as total
        FROM jobs
        ${whereSql}
        `,
        params
      );

    const total =
      countRows[0]?.total ?? 0;

    const items =
      await db.query(
        `
        SELECT
        job_id,
        platform,
        package_name,
        safe_name,
        app_name,
        url,
        scheme,
        status,
        progress,
        created_at,
        updated_at,
        finished_at,
        error_reason,
        artifact_dir,
        log_path
        FROM jobs
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        `,
        [...params, limit, offset]
      );

    res.json({
      items,
      page,
      limit,
      total
    });

  } catch (e) {

    res.status(500).json({
      error: String(e)
    });

  }

});



/**
 * Job Detail
 */
router.get("/:jobId", async (req, res) => {

  try {

    const jobId =
      req.params.jobId;

    const rows =
      await db.query(
        `
        SELECT *
        FROM jobs
        WHERE job_id=?
        LIMIT 1
        `,
        [jobId]
      );

    if (!rows.length) {

      return res.status(404).json({
        error: "Job not found"
      });

    }

    res.json(rows[0]);

  } catch (e) {

    res.status(500).json({
      error: String(e)
    });

  }

});



/**
 * Artifacts
 * 반드시 /:jobId 보다 위에 위치
 */
router.get("/:jobId/artifacts", async (req, res) => {

  try {

    const jobId =
      req.params.jobId;

    const rows =
      await db.query(
        `
        SELECT name,path
        FROM artifacts
        WHERE job_id=?
        `,
        [jobId]
      );

    const items =
      rows.map((r) => ({

        name: r.name,

        downloadUrl:
          `/downloads/${r.path}`

      }));

    res.json({
      items
    });

  } catch (e) {

    res.status(500).json({
      error: String(e)
    });

  }

});



/**
 * Log
 */
router.get("/:jobId/log", async (req, res) => {

  try {

    const { jobId } = req.params;

    const rows =
      await db.query(
        `
        SELECT log_path
        FROM jobs
        WHERE job_id = ?
        `,
        [jobId]
      );

    if (
      !rows.length ||
      !rows[0].log_path
    ) {

      return res
        .status(404)
        .json({
          error: "Log not found"
        });

    }

    const logPath =
      rows[0].log_path;

    const abs =
      path.isAbsolute(logPath)
        ? logPath
        : path.join(CI_ROOT, logPath);

    if (!fs.existsSync(abs)) {

      return res
        .status(404)
        .json({
          error: "Log file missing"
        });

    }

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.send(
      fs.readFileSync(abs, "utf-8")
    );

  } catch (e) {

    res.status(500).json({
      error: String(e)
    });

  }

});



/**
 * Job Delete
 */
router.delete("/", async (req, res) => {

  const jobIds =
    Array.isArray(req.body?.jobIds)
      ? req.body.jobIds
      : [];

  if (!jobIds.length) {

    return res
      .status(400)
      .json({
        error: "jobIds is required"
      });

  }

  const conn =
    await db.pool.getConnection();

  try {

    await conn.beginTransaction();

    const placeholders =
      jobIds.map(() => "?").join(",");

    const rows =
      await conn.query(
        `
        SELECT job_id, artifact_dir, log_path
        FROM jobs
        WHERE job_id IN (${placeholders})
        `,
        jobIds
      );

    const deletedFiles = [];
    const skipped = [];

    for (const r of rows) {

      const artifactAbs =
        safeAbsPathFromCiRoot(
          r.artifact_dir
        );

      const logAbs =
        safeAbsPathFromCiRoot(
          r.log_path
        );

      let ok = false;

      if (artifactAbs) {

        ok = rmrf(artifactAbs);

        if (ok)
          deletedFiles.push({
            jobId: r.job_id,
            removed: r.artifact_dir
          });

        else
          skipped.push({
            jobId: r.job_id,
            reason:
              "artifact_dir not removed"
          });

        continue;

      }

      if (logAbs) {

        ok = rmrf(logAbs);

        if (ok)
          deletedFiles.push({
            jobId: r.job_id,
            removed: r.log_path
          });

        else
          skipped.push({
            jobId: r.job_id,
            reason:
              "log_path not removed"
          });

        continue;

      }

      skipped.push({
        jobId: r.job_id,
        reason: "unsafe path"
      });

    }

    await conn.query(
      `
      DELETE FROM job_queue
      WHERE job_id IN (${placeholders})
      `,
      jobIds
    );

    const delJobs =
      await conn.query(
        `
        DELETE FROM jobs
        WHERE job_id IN (${placeholders})
        `,
        jobIds
      );

    await conn.commit();

    res.json({
      success: true,
      deletedCount:
        delJobs.affectedRows ?? 0,
      deletedFiles,
      skipped
    });

  } catch (e) {

    await conn.rollback();

    res.status(500).json({
      error: String(e)
    });

  } finally {

    conn.release();

  }

});



module.exports = router;