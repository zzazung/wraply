const express = require("express");
const { query } = require("@wraply/shared/db");

const router = express.Router();

router.get("/:artifactId", async (req, res) => {

  try {

    const { tenantId } = req.user;

    const rows = await query(
      `
      SELECT
        id,
        tenant_id,
        platform,
        path,
        size,
        created_at
      FROM artifacts
      WHERE id=? AND tenant_id=?
      `,
      [req.params.artifactId, tenantId]
    );

    if (!rows.length)
      return res.status(404).json({ error: "Artifact not found" });

    const a = rows[0];

    res.json({
      id: a.id,
      tenant_id: a.tenant_id,
      platform: a.platform,
      downloadUrl: `/downloads/${a.path}`,
      size: a.size,
      createdAt: a.created_at
    });

  } catch (err) {

    console.error("artifact error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

module.exports = router;
