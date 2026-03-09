const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const { query } = require("@wraply/shared/db");

const {
  STATES,
  getProgress,
  isValidTransition
} = require("@wraply/shared/job/jobState");

const { publishLog, publishStatus } = require("../bus/logBus");
const { registerBuild, unregisterBuild } = require("./buildRegistry");
const { startHeartbeat, stopHeartbeat } = require("../bus/heartbeatBus");

const BUILD_ROOT =
  process.env.WRAPLY_BUILD_ROOT ||
  "/tmp/wraply-builds";

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
    [uuidv4(), jobId, fileName, stat.size, type, filePath]
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

      const artifactPath =
        path.join(artifactDir, f);

      await saveArtifact(jobId, artifactPath);

      await publishLog(jobId, `artifact detected: ${f}`);

    }

  }

}

/**
 * 상태 전이 적용
 */
async function transition(jobId, nextState) {

  const rows = await query(
    `SELECT status FROM jobs WHERE job_id=?`,
    [jobId]
  );

  if (!rows || rows.length === 0) {
    throw new Error("job not found");
  }

  const current = rows[0].status;

  if (!isValidTransition(current, nextState)) {

    await publishLog(
      jobId,
      `invalid state transition ${current} -> ${nextState}`
    );

    return;
  }

  await publishStatus(
    jobId,
    nextState,
    getProgress(nextState)
  );

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

  const workspace =
    path.join(BUILD_ROOT, jobId);

  ensureDir(workspace);

  try {

    await transition(jobId, STATES.PREPARING);

    const heartbeatTimer = startHeartbeat(jobId);

    const workerRoot =
      process.env.WORKER_ROOT ||
      process.cwd();

    const scriptsDir =
      path.join(workerRoot, "scripts");

    let script;

    if (platform === "android") {

      script =
        path.join(
          scriptsDir,
          "build_android_fastlane.sh"
        );

    }

    if (platform === "ios") {

      script =
        path.join(
          scriptsDir,
          "build_ios_fastlane.sh"
        );

    }

    if (!script || !fs.existsSync(script)) {

      throw new Error(
        `build script not found for platform: ${platform}`
      );

    }

    await transition(jobId, STATES.PATCHING);

    await publishLog(jobId, `workspace: ${workspace}`);

    await transition(jobId, STATES.BUILDING);

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

    registerBuild(jobId, proc);

    let artifactDir = null;

    proc.stdout.on("data", async data => {

      const text = data.toString();

      await publishLog(jobId, text);

      if (text.includes("OUTPUT_DIR=")) {

        const parts =
          text.trim().split("OUTPUT_DIR=");

        if (parts.length > 1) {

          const candidate =
            path.resolve(
              workspace,
              parts[1].trim()
            );

          if (candidate.startsWith(workspace)) {

            artifactDir = candidate;

          } else {

            await publishLog(
              jobId,
              "invalid artifact path ignored"
            );

          }

        }

      }

    });

    proc.stderr.on("data", async data => {

      await publishLog(jobId, data.toString());

    });

    proc.on("error", async err => {

      await publishLog(jobId, `spawn error: ${err.message}`);

      await transition(jobId, STATES.FAILED);

      stopHeartbeat(heartbeatTimer);

      cleanupWorkspace(workspace);

    });

    const timeout = setTimeout(async () => {

      await publishLog(jobId, "build timeout");

      proc.kill("SIGKILL");

      await transition(jobId, STATES.FAILED);

      stopHeartbeat(heartbeatTimer);

    }, 30 * 60 * 1000);

    proc.on("close", async code => {

      clearTimeout(timeout);

      unregisterBuild(jobId);

      if (code === 0) {

        await transition(jobId, STATES.SIGNING);

        await transition(jobId, STATES.UPLOADING);

        await scanArtifacts(jobId, artifactDir);

        await transition(jobId, STATES.FINISHED);

      } else {

        await transition(jobId, STATES.FAILED);

      }

      stopHeartbeat(heartbeatTimer);

      cleanupWorkspace(workspace);

    });

  } catch (err) {

    await publishLog(jobId, err.message);

    await transition(jobId, STATES.FAILED);

    stopHeartbeat(heartbeatTimer);

    cleanupWorkspace(workspace);

  }

}

module.exports = { runBuild };