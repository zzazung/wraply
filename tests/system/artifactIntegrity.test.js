const fs = require("fs");
const path = require("path");

const { query } = require("@wraply/shared/db");

describe("Artifact integrity", () => {

  const buildDir =
    process.env.WRAPLY_BUILD_ROOT || "/tmp/wraply-test-builds";

  test("artifact scan matches DB", async () => {

    const jobId = "artifact-test";

    const dir = path.join(buildDir, jobId);

    fs.mkdirSync(dir, { recursive: true });

    const filePath =
      path.join(dir, "app.apk");

    fs.writeFileSync(filePath, "fake-apk");

    await query(
      `
      INSERT INTO artifacts
      (job_id, file_name, file_path, file_size, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [
        jobId,
        "app.apk",
        filePath,
        fs.statSync(filePath).size
      ]
    );

    const rows = await query(
      `
      SELECT file_name, file_path
      FROM artifacts
      WHERE job_id = ?
      `,
      [jobId]
    );

    expect(rows.length).toBeGreaterThan(0);

    rows.forEach(row => {

      expect(
        fs.existsSync(row.file_path)
      ).toBe(true);

    });

  });

});