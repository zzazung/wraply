// api/routes/user.projects.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { requireAuth } = require("../middleware/auth")
const { enqueueBuild } = require("../queue/buildQueue");

const pool = require("../db");

const router = express.Router();

router.use(requireAuth);

// ✅ projects 목록
router.get("/projects", requireUser, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, safe_name, package_name, app_name, service_url, scheme, created_at, updated_at
       FROM projects
       ORDER BY created_at DESC`
    );
    res.json({
      items: rows.map((r) => ({
        id: r.id,
        name: r.app_name || r.safe_name,         // UI용 name (원하면 컬럼 추가 가능)
        packageName: r.package_name || "",
        appName: r.app_name || "",
        serviceUrl: r.service_url || "",
        safeName: r.safe_name,
        scheme: r.scheme || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ✅ projects 생성(또는 upsert)
router.post("/projects", requireUser, async (req, res) => {
  try {
    const { packageName, appName, serviceUrl, scheme } = req.body || {};
    if (!packageName) return res.status(400).json({ error: "packageName required" });

    const safeName = String(packageName).replace(/\./g, "_");
    const id = uuidv4();

    // safe_name unique 전제: 이미 있으면 업데이트
    await pool.query(
      `INSERT INTO projects (id, safe_name, package_name, app_name, service_url, scheme)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         package_name=VALUES(package_name),
         app_name=VALUES(app_name),
         service_url=VALUES(service_url),
         scheme=VALUES(scheme),
         updated_at=NOW()`,
      [id, safeName, packageName, appName || null, serviceUrl || null, scheme || null]
    );

    const [rows] = await pool.query(`SELECT * FROM projects WHERE safe_name=?`, [safeName]);
    res.json({ project: rows[0] });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ✅ projects 상세
router.get("/projects/:projectId", requireUser, async (req, res) => {
  try {
    const { projectId } = req.params;
    const [rows] = await pool.query(
      `SELECT id, safe_name, package_name, app_name, service_url, scheme, created_at, updated_at
       FROM projects WHERE id=?`,
      [projectId]
    );
    if (!rows.length) return res.status(404).json({ error: "Project not found" });
    res.json({
      project: {
        id: rows[0].id,
        name: rows[0].app_name || rows[0].safe_name,
        packageName: rows[0].package_name || "",
        appName: rows[0].app_name || "",
        serviceUrl: rows[0].service_url || "",
        safeName: rows[0].safe_name,
        scheme: rows[0].scheme || null,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
      },
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ✅ 프로젝트에서 빌드 요청 생성 (jobs + job_queue enqueue)
// POST /user/projects/:projectId/builds { platform: "android"|"ios" }
router.post("/projects/:projectId/builds", requireUser, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { platform } = req.body || {};
    if (!platform) return res.status(400).json({ error: "platform required" });

    const [pRows] = await pool.query(`SELECT * FROM projects WHERE id=?`, [projectId]);
    if (!pRows.length) return res.status(404).json({ error: "Project not found" });
    const p = pRows[0];

    // 프로젝트 기본값 사용
    const packageName = p.package_name;
    const appName = p.app_name || p.safe_name;
    const url = p.service_url;
    const scheme = p.scheme || null;

    if (!packageName || !url) {
      return res.status(400).json({ error: "Project missing packageName/serviceUrl" });
    }

    const jobId = `job_${uuidv4()}`;

    await pool.query(
      `INSERT INTO jobs (job_id, project_id, platform, package_name, safe_name, app_name, url, scheme, status, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0)`,
      [jobId, p.id, platform, packageName, p.safe_name, appName, url, scheme]
    );

    await pool.query(
      "INSERT INTO job_queue (job_id, status) VALUES (?, 'queued') ON DUPLICATE KEY UPDATE status='queued'",
      [jobId]
    );

    res.json({ jobId });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ✅ 프로젝트 빌드 이력
router.get("/projects/:projectId/builds", requireUser, async (req, res) => {
  // try {
  //   const { projectId } = req.params;
  //   const [rows] = await pool.query(
  //     `SELECT job_id, project_id, platform, status, progress, package_name, app_name, url,
  //             created_at, updated_at, finished_at, error_reason
  //      FROM jobs
  //      WHERE project_id=?
  //      ORDER BY created_at DESC`,
  //     [projectId]
  //   );
  //   res.json({ items: rows });
  // } catch (e) {
  //   res.status(500).json({ error: String(e.message || e) });
  // }

  const { projectId } = req.params;

  const jobId = `job_${crypto.randomUUID()}`;

  await db.query(
    `INSERT INTO jobs(job_id, project_id, status, progress)
     VALUES(?,?, 'queued', 0)`,
    [jobId, projectId]
  );

  await enqueueBuild({
    jobId,
    projectId
  });

  res.json({
    jobId
  });
});

module.exports = router;