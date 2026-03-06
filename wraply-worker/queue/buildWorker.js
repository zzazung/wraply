const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const { query } = require("@wraply/shared/db");
const { publishLog, publishStatus } = require("../bus/logBus");

const BUILD_ROOT = process.env.WRAPLY_BUILD_ROOT || "/tmp/wraply-builds";

function ensureDir(dir) {

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

}

function cleanupWorkspace(dir) {

  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}

}

async function saveArtifact(jobId, filePath) {

  const stat = fs.statSync(filePath);

  const fileName = path.basename(filePath);

  let type = "file";

  if (fileName.endsWith(".apk")) type = "apk";
  if (fileName.endsWith(".aab")) type = "aab";
  if (fileName.endsWith(".ipa")) type = "ipa";

  await query(
    `
    INSERT INTO artifacts
    (id, job_id, file_name, file_size, file_type, file_path)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      uuidv4(),
      jobId,
      fileName,
      stat.size,
      type,
      filePath
    ]
  );

}

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

      await saveArtifact(jobId, artifactPath);

      await publishLog(jobId, `📦 artifact detected: ${f}`);

    }

  }

}

async function runBuild(job) {

  const {
    jobId,
    platform,
    safeName,
    packageName,
    appName,
    serviceUrl
  } = job;

  const workspace = path.join(BUILD_ROOT, jobId);

  ensureDir(workspace);

  try {

    await publishStatus(jobId, "running", 5);

    const workerRoot = process.env.WORKER_ROOT || process.cwd();

    const scriptsDir = path.join(workerRoot, "scripts");

    let script;

    if (platform === "android") {
      script = path.join(scriptsDir, "build_android_fastlane.sh");
    }

    if (platform === "ios") {
      script = path.join(scriptsDir, "build_ios_fastlane.sh");
    }

    await publishLog(jobId, `workspace: ${workspace}`);

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
        cwd: workspace,
        env: process.env
      }
    );

    let artifactDir = null;

    proc.stdout.on("data", async (data) => {

      const text = data.toString();

      await publishLog(jobId, text);

      if (text.includes("OUTPUT_DIR=")) {

        const parts = text.trim().split("OUTPUT_DIR=");

        if (parts.length > 1) {

          artifactDir = path.join(workspace, parts[1].trim());

        }

      }

    });

    proc.stderr.on("data", async (data) => {

      await publishLog(jobId, data.toString());

    });

    const timeout = setTimeout(() => {

      proc.kill("SIGKILL");

    }, 30 * 60 * 1000);

    proc.on("close", async (code) => {

      clearTimeout(timeout);

      if (code === 0) {

        await publishStatus(jobId, "success", 100);

        await query(
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

        await query(
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

      cleanupWorkspace(workspace);

    });

  } catch (err) {

    await publishLog(jobId, err.message);

    cleanupWorkspace(workspace);

  }

}

module.exports = {
  runBuild
};