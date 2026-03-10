// api/routes/user.projects.js

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { requireAuth } = require("../middleware/auth");
const { enqueueBuild } = require("../queue/buildQueue");

const { query } = require("@wraply/shared/db");

const router = express.Router();

router.use(requireAuth);


/**
 * projects 목록
 */
router.get("/", async (req, res) => {

  try {

    const rows = await query(
      `
      SELECT
        id,
        safe_name,
        package_name,
        app_name,
        service_url,
        scheme,
        created_at,
        updated_at
      FROM projects
      ORDER BY created_at DESC
      `
    );

    res.json({
      items: rows.map((r) => ({
        id: r.id,
        name: r.app_name || r.safe_name,
        packageName: r.package_name || "",
        appName: r.app_name || "",
        serviceUrl: r.service_url || "",
        safeName: r.safe_name,
        scheme: r.scheme || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
    });

  } catch (e) {

    res.status(500).json({
      error: String(e.message || e)
    });

  }

});


/**
 * project 생성 (upsert)
 */
router.post("/", async (req, res) => {

  try {

    const {
      packageName,
      appName,
      serviceUrl,
      scheme
    } = req.body || {};

    if (!packageName) {

      return res.status(400).json({
        error: "packageName required"
      });

    }

    const safeName =
      String(packageName).replace(/\./g, "_");

    const id = uuidv4();

    await query(
      `
      INSERT INTO projects
      (
        id,
        safe_name,
        package_name,
        app_name,
        service_url,
        scheme
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        package_name = VALUES(package_name),
        app_name = VALUES(app_name),
        service_url = VALUES(service_url),
        scheme = VALUES(scheme),
        updated_at = NOW()
      `,
      [
        id,
        safeName,
        packageName,
        appName || null,
        serviceUrl || null,
        scheme || null
      ]
    );

    const rows = await query(
      `SELECT * FROM projects WHERE safe_name=?`,
      [safeName]
    );

    res.json({
      project: rows[0]
    });

  } catch (e) {

    res.status(500).json({
      error: String(e.message || e)
    });

  }

});


/**
 * project 상세
 */
router.get("/:projectId", async (req, res) => {

  try {

    const { projectId } = req.params;

    const rows = await query(
      `
      SELECT
        id,
        safe_name,
        package_name,
        app_name,
        service_url,
        scheme,
        created_at,
        updated_at
      FROM projects
      WHERE id=?
      `,
      [projectId]
    );

    if (!rows.length) {

      return res.status(404).json({
        error: "Project not found"
      });

    }

    const p = rows[0];

    res.json({
      project: {
        id: p.id,
        name: p.app_name || p.safe_name,
        packageName: p.package_name || "",
        appName: p.app_name || "",
        serviceUrl: p.service_url || "",
        safeName: p.safe_name,
        scheme: p.scheme || null,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }
    });

  } catch (e) {

    res.status(500).json({
      error: String(e.message || e)
    });

  }

});


/**
 * 프로젝트에서 build 요청
 */
router.post("/:projectId/builds", async (req, res) => {

  try {

    const { projectId } = req.params;

    const { platform } = req.body || {};

    if (!platform) {

      return res.status(400).json({
        error: "platform required"
      });

    }

    const rows = await query(
      `SELECT * FROM projects WHERE id=?`,
      [projectId]
    );

    if (!rows.length) {

      return res.status(404).json({
        error: "Project not found"
      });

    }

    const p = rows[0];

    const jobId =
      `job_${uuidv4()}`;

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
        progress
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0)
      `,
      [
        jobId,
        p.id,
        platform,
        p.package_name,
        p.safe_name,
        p.app_name || p.safe_name,
        p.service_url,
        p.scheme
      ]
    );

    await enqueueBuild({
      jobId,
      platform,
      safeName: p.safe_name,
      packageName: p.package_name,
      appName: p.app_name,
      serviceUrl: p.service_url
    });

    res.json({
      jobId
    });

  } catch (e) {

    res.status(500).json({
      error: String(e.message || e)
    });

  }

});


/**
 * 프로젝트 build 이력
 */
router.get("/:projectId/builds", async (req, res) => {

  try {

    const { projectId } = req.params;

    const rows = await query(
      `
      SELECT
        job_id,
        project_id,
        platform,
        status,
        progress,
        package_name,
        app_name,
        url,
        created_at,
        updated_at,
        finished_at,
        error_reason
      FROM jobs
      WHERE project_id=?
      ORDER BY created_at DESC
      `,
      [projectId]
    );

    res.json({
      items: rows
    });

  } catch (e) {

    res.status(500).json({
      error: String(e.message || e)
    });

  }

});


module.exports = router;