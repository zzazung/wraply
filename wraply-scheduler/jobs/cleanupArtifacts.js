const { query } = require("@wraply/shared/db");
const fs = require("fs");

async function cleanupArtifacts() {

  console.log("Cleanup artifacts");

  const rows = await query(`
    SELECT id, file_path
    FROM artifacts
    WHERE created_at < NOW() - INTERVAL 30 DAY
  `);

  for (const artifact of rows) {

    try {

      fs.unlinkSync(artifact.file_path);

      await query(`
        DELETE FROM artifacts
        WHERE id = ?
      `, [artifact.id]);

      console.log("Removed artifact", artifact.file_path);

    } catch (err) {

      console.error("Cleanup error", err);

    }

  }

}

module.exports = cleanupArtifacts;