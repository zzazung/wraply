const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

const { v4: uuidv4 } = require("uuid")
const db = require("../../wraply-api/db");
const { publishLog, publishStatus } = require("../bus/logBus");

require('dotenv').config();

async function saveArtifact(jobId, filePath) {

  const fs = require("fs")
  const path = require("path")

  const stat = fs.statSync(filePath)

  const fileName = path.basename(filePath)

  let type = "file"

  if (fileName.endsWith(".apk")) type = "apk"
  if (fileName.endsWith(".aab")) type = "aab"
  if (fileName.endsWith(".ipa")) type = "ipa"

  await pool.query(`
    INSERT INTO artifacts
    (id, job_id, file_name, file_size, file_type, file_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    uuidv4(),
    jobId,
    fileName,
    stat.size,
    type,
    filePath
  ])

}

/**
 * artifact scan
 */
async function scanArtifacts(jobId, artifactDir) {

  if (!artifactDir) return;

  if (!fs.existsSync(artifactDir)) return;

  const files = fs.readdirSync(artifactDir);

  for (const f of files) {

    if (
      f.endsWith(".apk") ||
      f.endsWith(".aab") ||
      f.endsWith(".ipa")
    ) {

      const artifactPath = path.join(artifactDir, f);

      await saveArtifact(jobId, artifactPath)

      await db.query(
        `
        INSERT INTO artifacts(job_id,name,path)
        VALUES(?,?,?)
        `,
        [
          jobId,
          f,
          `${jobId}/${f}`
        ]
      );

      await publishLog(jobId, `📦 artifact detected: ${f}`);
    }

  }

}

/**
 * build worker
 * job payload example
 * {
 *   jobId: "job_xxx",
 *   platform: "android",
 *   projectId: "...",
 *   safeName: "...",
 *   packageName: "...",
 *   appName: "...",
 *   serviceUrl: "..."
 * }
 */

async function runBuild(job) {

  const {
    jobId,
    platform,
    safeName,
    packageName,
    appName,
    serviceUrl
  } = job;

  try {

    publishStatus(jobId, "running", 5);

    const workerRoot = process.env.WORKER_ROOT || process.cwd();

    const scriptsDir = path.join(workerRoot, "scripts");

    let script;

    if (platform === "android") {

      script = path.join(scriptsDir, "build_android_fastlane.sh");

    } else if (platform === "ios") {

      script = path.join(scriptsDir, "build_ios_fastlane.sh");

    } else {

      throw new Error("Unsupported platform");

    }

    publishLog(jobId, `🚀 Build started (${platform})`);
    publishLog(jobId, `script: ${script}`);

    const proc = spawn(
      "bash",
      [
        script,
        safeName,
        packageName,
        appName,
        serviceUrl
      ],
      {
        cwd: workerRoot,
        env: process.env
      }
    );

    let artifactDir = null;

    // stdout
    proc.stdout.on("data", async (data) => {

      const text = data.toString();

      await publishLog(jobId, text);

      // parse OUTPUT_DIR
      if (text.includes("OUTPUT_DIR=")) {

        const parts = text.trim().split("OUTPUT_DIR=");

        if (parts.length > 1) {

          artifactDir = path.join(workerRoot, parts[1].trim());

          await publishLog(jobId, `artifact dir detected: ${artifactDir}`);

        }

      }

    });

    // stderr
    proc.stderr.on("data", async (data) => {

      const text = data.toString();

      await publishLog(jobId, text);

    });

    proc.on("error", async (err) => {

      await publishLog(jobId, `❌ build process error: ${err.message}`);

    });

    /**
     * timeout 보호
     */
    const timeout = setTimeout(() => {

      proc.kill("SIGKILL");

    }, 30 * 60 * 1000);

    proc.on("close", async (code) => {

      clearTimeout(timeout);

      if (code === 0) {

        await publishStatus(jobId, "success", 100);

        await publishLog(jobId, "✅ build completed");

        await db.query(
          `
          UPDATE jobs
          SET status='success',
              progress=100,
              finished_at=NOW()
          WHERE job_id=?
          `,
          [jobId]
        );

        await scanArtifacts(jobId, artifactDir);

      } else {

        await publishStatus(jobId, "failed", 100);

        await publishLog(jobId, `❌ build failed (exit code ${code})`);

        await db.query(
          `
          UPDATE jobs
          SET status='failed',
              progress=100,
              finished_at=NOW()
          WHERE job_id=?
          `,
          [jobId]
        );

      }

    });

  } catch (err) {

    await publishLog(jobId, `❌ worker error: ${err.message}`);

    await publishStatus(jobId, "failed", 100);

    await db.query(
      `
      UPDATE jobs
      SET status='failed',
          progress=100,
          finished_at=NOW()
      WHERE job_id=?
      `,
      [jobId]
    );

  }

}

module.exports = {
  runBuild
};