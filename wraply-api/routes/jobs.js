// api/routes/jobs.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const pool = require("@wraply/shared/db");

require('dotenv').config();

const router = express.Router();

const CI_ROOT = process.env.CI_ROOT || process.cwd();
const API_BASE = process.env.API_BASE || `http://localhost:${process.env.API_PORT || 4000}`;

// api/routes/jobs.js 상단에 이미 있을 것:
// const fs = require("fs");
// const path = require("path");
// const pool = require("../../db");
// const CI_ROOT = process.env.CI_ROOT || process.cwd();

function safeAbsPathFromCiRoot(relPath) {
  if (!relPath) return null;

  // 절대경로 금지
  if (path.isAbsolute(relPath)) return null;

  // 정규화 후 빌드 폴더만 허용
  const normalized = relPath.replace(/\\/g, "/");
  if (!normalized.startsWith("builds/")) return null;
  if (normalized.includes("..")) return null;

  const abs = path.join(CI_ROOT, normalized);

  // CI_ROOT 밖으로 탈출 방지
  const rel = path.relative(CI_ROOT, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;

  return abs;
}

function rmrf(absPath) {
  try {
    if (absPath && fs.existsSync(absPath)) {
      fs.rmSync(absPath, { recursive: true, force: true });
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
    const { platform, packageName, appName, url, scheme } = req.body;

    if (!platform || !packageName || !appName || !url) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const jobId = `job_${uuidv4()}`;
    const safeName = packageName.replace(/\./g, "_");

    await pool.query(
      `INSERT INTO jobs
       (job_id, platform, package_name, safe_name, app_name, url, scheme, status, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', 0)`,
      [jobId, platform, packageName, safeName, appName, url, scheme || null]
    );

    await pool.query(
      "INSERT INTO job_queue (job_id, status) VALUES (?, 'queued') ON DUPLICATE KEY UPDATE status='queued'",
      [jobId]
    );

    res.json({ success: true, jobId });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * History
 */
router.get("/", async (req, res) => {
  try {
    const platform = (req.query.platform || "").toString();
    const status = (req.query.status || "").toString();
    const q = (req.query.q || "").toString();
    const page = Math.max(1, parseInt((req.query.page || "1").toString(), 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit || "20").toString(), 10)));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (platform) { where.push("platform = ?"); params.push(platform); }
    if (status) { where.push("status = ?"); params.push(status); }
    if (q) {
      where.push("(job_id LIKE ? OR package_name LIKE ? OR safe_name LIKE ? OR app_name LIKE ? OR url LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM jobs ${whereSql}`, params);
    const total = countRows[0]?.total ?? 0;

    const [items] = await pool.query(
      `
      SELECT job_id, platform, package_name, safe_name, app_name, url, scheme,
             status, progress, created_at, updated_at, finished_at, error_reason,
             artifact_dir, log_path
      FROM jobs
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({ items, page, limit, total });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * Job detail
 */
router.get("/:jobId", async (req, res) => {
  try {
    // const { jobId } = req.params;
    // const [rows] = await pool.query(
    //   `SELECT job_id, project_id, platform, package_name, safe_name, app_name, url, scheme,
    //           status, progress, created_at, updated_at, finished_at, error_reason,
    //           artifact_dir, log_path
    //    FROM jobs WHERE job_id = ?`,
    //   [jobId]
    // );
    // if (!rows.length) return res.status(404).json({ error: "Job not found" });
    // res.json(rows[0]);

    const jobId = req.params.jobId;

    const rows = await db.query(
      `SELECT * FROM jobs WHERE job_id=? LIMIT 1`,
      [jobId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ✅ 반드시 /:jobId 보다 위
router.get("/:jobId/artifacts", async (req, res) => {
  try {
    // const { jobId } = req.params;

    // const [rows] = await pool.query(
    //   "SELECT artifact_dir FROM jobs WHERE job_id = ?",
    //   [jobId]
    // );
    // if (!rows.length) return res.status(404).json({ error: "Job not found" });

    // let artifactDir = rows[0].artifact_dir;
    // if (!artifactDir) return res.json({ items: [] });

    // // ✅ 절대경로가 저장되어 있어도 운영형으로 강제 보정
    // // 1) CI_ROOT 접두사가 있으면 잘라냄
    // if (path.isAbsolute(artifactDir)) {
    //   artifactDir = path.relative(CI_ROOT, artifactDir);
    // }

    // // 2) builds/로 시작하지 않으면 builds 기준으로 보정(방어)
    // //    (artifactDir가 'android/...' 로만 올 수도 있으니)
    // if (!artifactDir.startsWith("builds/")) {
    //   artifactDir = `builds/${artifactDir.replace(/^\/+/, "")}`;
    // }

    // const absDir = path.join(CI_ROOT, artifactDir);
    // if (!fs.existsSync(absDir)) return res.json({ items: [] });

    // const files = fs.readdirSync(absDir).filter((f) => !f.endsWith(".xcarchive"));

    // const base = API_BASE || `${req.protocol}://${req.get("host")}`;

    // const items = files.map((file) => {
    //   // ✅ /downloads 는 CI_ROOT/builds 를 가리키므로
    //   //    builds/ 를 제거한 나머지 경로만 붙인다
    //   const relUnderBuilds = artifactDir.replace(/^builds\//, "");
    //   const downloadUrl = `/downloads/${relUnderBuilds}/${file}`;
    //   return {
    //     name: file,
    //     downloadUrl,
    //     fullUrl: `${base}${downloadUrl}`,
    //   };
    // });

    // res.json({ items });

    const jobId = req.params.jobId;

    const rows = await db.query(
      `SELECT name,path FROM artifacts WHERE job_id=?`,
      [jobId]
    );

    const items = rows.map((r) => ({
      name: r.name,
      downloadUrl: `/downloads/${r.path}`,
    }));

    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * Log
 */
router.get("/:jobId/log", async (req, res) => {
  try {
    const { jobId } = req.params;

    const [rows] = await pool.query("SELECT log_path FROM jobs WHERE job_id = ?", [jobId]);
    if (!rows.length || !rows[0].log_path) return res.status(404).json({ error: "Log not found" });

    const logPath = rows[0].log_path;
    const abs = path.isAbsolute(logPath) ? logPath : path.join(CI_ROOT, logPath);

    if (!fs.existsSync(abs)) return res.status(404).json({ error: "Log file missing" });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(fs.readFileSync(abs, "utf-8"));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * ✅ 선택 삭제
 * DELETE /jobs
 * body: { jobIds: string[] }
 */
router.delete("/", async (req, res) => {
  const jobIds = Array.isArray(req.body?.jobIds) ? req.body.jobIds : [];

  if (!jobIds.length) {
    return res.status(400).json({ error: "jobIds is required" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 삭제할 job의 경로 수집
    const placeholders = jobIds.map(() => "?").join(",");
    const [rows] = await conn.query(
      `SELECT job_id, artifact_dir, log_path FROM jobs WHERE job_id IN (${placeholders})`,
      jobIds
    );

    // 2) 파일/디렉토리 삭제 (CI_ROOT/builds 내부만)
    //    - artifact_dir 폴더가 있으면 폴더째 삭제(가장 간단/확실)
    //    - artifact_dir가 없으면 log_path만 삭제
    const deletedFiles = [];
    const skipped = [];

    for (const r of rows) {
      const artifactAbs = safeAbsPathFromCiRoot(r.artifact_dir);
      const logAbs = safeAbsPathFromCiRoot(r.log_path);

      let ok = false;

      if (artifactAbs) {
        ok = rmrf(artifactAbs);
        if (ok) deletedFiles.push({ jobId: r.job_id, removed: r.artifact_dir });
        else skipped.push({ jobId: r.job_id, reason: "artifact_dir not removed" });
        continue;
      }

      if (logAbs) {
        ok = rmrf(logAbs);
        if (ok) deletedFiles.push({ jobId: r.job_id, removed: r.log_path });
        else skipped.push({ jobId: r.job_id, reason: "log_path not removed" });
        continue;
      }

      // 둘 다 안전하지 않으면 스킵
      skipped.push({ jobId: r.job_id, reason: "unsafe path" });
    }

    // 3) DB 삭제 (queue -> jobs 순서 권장)
    await conn.query(
      `DELETE FROM job_queue WHERE job_id IN (${placeholders})`,
      jobIds
    );
    const [delJobs] = await conn.query(
      `DELETE FROM jobs WHERE job_id IN (${placeholders})`,
      jobIds
    );

    await conn.commit();

    res.json({
      success: true,
      deletedCount: delJobs.affectedRows ?? 0,
      deletedFiles,
      skipped,
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: String(e) });
  } finally {
    conn.release();
  }
});

module.exports = router;