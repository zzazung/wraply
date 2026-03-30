const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("@wraply/shared/db");

const router = express.Router({ mergeParams: true });

/**
 * 목록
 */
router.get("/", async (req, res) => {

  const { tenantId } = req.user;
  const { projectId } = req.params;

  const rows = await query(`
    SELECT id, type, config, created_at, updated_at
    FROM project_targets
    WHERE project_id = ?
  `, [projectId]);

  const items = rows.map(r => ({
    id: r.id,
    type: r.type,
    config: JSON.parse(r.config || "{}"),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  res.json({ items });

});

/**
 * 단건
 */
router.get("/:type", async (req, res) => {

  const { projectId, type } = req.params;

  const rows = await query(`
    SELECT *
    FROM project_targets
    WHERE project_id = ?
    AND type = ?
    LIMIT 1
  `, [projectId, type]);

  if (!rows.length) {
    return res.status(404).json({ error: "Target not found" });
  }

  const r = rows[0];

  res.json({
    id: r.id,
    type: r.type,
    config: JSON.parse(r.config || "{}")
  });

});

/**
 * upsert
 */
router.post("/", async (req, res) => {

  const { projectId } = req.params;
  const { type, config, enabled = true } = req.body;

  if (!type) {
    return res.status(400).json({ error: "type required" });
  }

  await query(`
    INSERT INTO project_targets (id, project_id, type, config)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      config = VALUES(config),
      updated_at = NOW()
  `, [
    uuidv4(),
    projectId,
    type,
    JSON.stringify(config || {})
  ]);

  res.json({ success: true });

});

/**
 * 삭제
 */
router.delete("/:type", async (req, res) => {

  const { projectId, type } = req.params;

  await query(`
    DELETE FROM project_targets
    WHERE project_id = ?
    AND type = ?
  `, [projectId, type]);

  res.json({ success: true });

});

module.exports = router;