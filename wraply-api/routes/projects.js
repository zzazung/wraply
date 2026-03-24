// wraply-api/routes/projects.js

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { query } = require("@wraply/shared/db");
const { requireAuth } = require("../middleware/auth");
const { enqueueBuild } = require("../queue/buildQueue");

const router = express.Router();

/**
 * Project List
 */
router.get("/", requireAuth, async (req, res) => {

  try {

    const { tenantId } = req.user;

    const rows = await query(
      `
      SELECT
        id,
        tenant_id,
        name,
        safe_name,
        package_name,
        bundle_id,
        created_at,
        updated_at
      FROM projects
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      `,
      [tenantId]
    );

    res.json({ items: rows });

  } catch (err) {

    console.error("project list error:", err);
    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Project Create
 */
router.post("/", requireAuth, async (req, res) => {

  try {

    const { tenantId } = req.user;

    const {
      name,
      packageName,
      bundleId
    } = req.body;

    if (!name || !packageName) {
      return res.status(400).json({ error: "Invalid fields" });
    }

    const id = uuidv4();
    const safeName = packageName.replace(/\./g, "_");

    await query(
      `
      INSERT INTO projects (
        id,
        tenant_id,
        name,
        safe_name,
        package_name,
        bundle_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        id,
        tenantId,
        name,
        safeName,
        packageName,
        bundleId || null
      ]
    );

    res.json({ id });

  } catch (err) {

    console.error("project create error:", err);
    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Project Detail
 */
router.get("/:projectId", requireAuth, async (req, res) => {

  try {

    const { tenantId } = req.user;

    const rows = await query(
      `
      SELECT *
      FROM projects
      WHERE id = ?
      AND tenant_id = ?
      LIMIT 1
      `,
      [req.params.projectId, tenantId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(rows[0]);

  } catch (err) {

    console.error("project detail error:", err);
    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Project Builds (History)
 */
router.get("/:projectId/builds", requireAuth, async (req, res) => {

  try {

    const { tenantId } = req.user;
    const { projectId } = req.params;

    /**
     * project 소유권 검증
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

    const builds = await query(
      `
      SELECT
        job_id,
        tenant_id,
        platform,
        status,
        progress,
        created_at
      FROM jobs
      WHERE project_id = ?
      AND tenant_id = ?
      ORDER BY created_at DESC
      `,
      [projectId, tenantId]
    );

    res.json({ items: builds });

  } catch (err) {

    console.error("project builds error:", err);
    res.status(500).json({ error: "internal error" });

  }

});

/**
 * ❗ LEGACY (삭제 예정)
 */
router.post("/:projectId/builds", requireAuth, async (req, res) => {

  try {

    const { tenantId } = req.user;
    const { projectId } = req.params;

    const {
      platform,
      packageName,
      appName,
      url,
      scheme
    } = req.body || {};

    if (!platform || !packageName) {
      return res.status(400).json({ error: "Invalid fields" });
    }

    /**
     * project 검증
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
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, NOW(), NOW())
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
      url
    });

    res.json({
      success: true,
      jobId
    });

  } catch (err) {

    console.error("build request error:", err);
    res.status(500).json({ error: "internal error" });

  }

});

module.exports = router;