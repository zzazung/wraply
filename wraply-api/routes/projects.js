// api/routes/projects.js

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { query } = require("@wraply/shared/db");

const router = express.Router();

/**
 * Project List
 */
router.get("/", async (req, res) => {

  try {

    const rows = await query(
      `
      SELECT
        id,
        name,
        created_at,
        updated_at
      FROM projects
      ORDER BY created_at DESC
      `
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
router.post("/", async (req, res) => {

  try {

    const { name, packageName } = req.body;

    if (!name || !packageName)
      return res.status(400).json({ error: "Invalid fields" });

    const id = `project_${uuidv4()}`;

    await query(
      `
      INSERT INTO projects
      (id, name)
      VALUES (?, ?)
      `,
      [id, name]
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
router.get("/:projectId", async (req, res) => {

  try {

    const rows = await query(
      `SELECT * FROM projects WHERE id=?`,
      [req.params.projectId]
    );

    if (!rows.length)
      return res.status(404).json({ error: "Project not found" });

    res.json(rows[0]);

  } catch (err) {

    console.error("project detail error:", err);
    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Project Builds (History)
 */
router.get("/:projectId/builds", async (req, res) => {

  try {

    const rows = await query(
      `
      SELECT
        job_id,
        platform,
        status,
        progress,
        created_at
      FROM jobs
      WHERE project_id=?
      ORDER BY created_at DESC
      `,
      [req.params.projectId]
    );

    res.json({ items: rows });

  } catch (err) {

    console.error("project builds error:", err);
    res.status(500).json({ error: "internal error" });

  }

});

/**
 * Build Request
 */
router.post("/:projectId/builds", async (req, res) => {

  try {

    const { projectId } = req.params;

    const {
      platform,
      packageName,
      appName,
      serviceUrl,
      scheme
    } = req.body || {};

    if (!platform || !packageName)
      return res.status(400).json({
        error: "Invalid fields"
      });

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
        progress
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0)
      `,
      [
        jobId,
        projectId,
        platform,
        packageName,
        safeName,
        appName || null,
        serviceUrl || null,
        scheme || null
      ]
    );

    const { enqueueBuild } = require("../queue/buildQueue");

    await enqueueBuild({ jobId });

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