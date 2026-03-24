const fs = require("fs");
const path = require("path");

const { query } = require("@wraply/shared/db");

const ARTIFACT_ROOT =
  process.env.ARTIFACT_DIR ||
  path.join(process.cwd(), "artifacts");

async function cleanupArtifacts() {

  const rows = await query(`
    SELECT id, tenant_id, path
    FROM artifacts
    WHERE created_at < NOW() - INTERVAL 7 DAY
  `);

  for (const a of rows) {

    const fullPath = path.join(process.cwd(), a.path);

    try {

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

    } catch (err) {

      console.error("[cleanup] file delete failed:", fullPath);

    }

    await query(`
      DELETE FROM artifacts
      WHERE id=? AND tenant_id=?
    `, [a.id, a.tenant_id]);

  }

}

module.exports = { cleanupArtifacts };