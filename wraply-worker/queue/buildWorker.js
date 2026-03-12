const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const os = require("os");
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

const CI_ROOT =
  process.env.CI_ROOT ||
  BUILD_ROOT;

const WORKER_ID =
  process.env.WORKER_ID ||
  `${os.hostname()}-${process.pid}`;

const BUILD_HOST =
  os.hostname();

/* workspace helpers */

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

/* checksum */

function sha256(filePath) {

  const hash =
    crypto.createHash("sha256");

  const buffer =
    fs.readFileSync(filePath);

  hash.update(buffer);

  return hash.digest("hex");

}

/* artifact save */

async function saveArtifact(
  jobId,
  platform,
  filePath
) {

  const stat =
    fs.statSync(filePath);

  const name =
    path.basename(filePath);

  const relPath =
    path.relative(CI_ROOT, filePath);

  let type = null;

  if (name.endsWith(".apk")) type = "apk";
  if (name.endsWith(".aab")) type = "aab";
  if (name.endsWith(".ipa")) type = "ipa";

  const checksum =
    sha256(filePath);

  await query(
    `
    INSERT INTO artifacts
    (
      id,
      job_id,
      platform,
      type,
      name,
      path,
      size,
      checksum
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      uuidv4(),
      jobId,
      platform,
      type,
      name,
      relPath,
      stat.size,
      checksum
    ]
  );

}

/* artifact scan */

async function scanArtifacts(
  jobId,
  platform,
  artifactDir
) {

  if (!artifactDir) return;
  if (!fs.existsSync(artifactDir)) return;

  const files =
    fs.readdirSync(artifactDir);

  for (const f of files) {

    if (
      f.endsWith(".apk") ||
      f.endsWith(".aab") ||
      f.endsWith(".ipa")
    ) {

      const artifactPath =
        path.join(artifactDir, f);

      await saveArtifact(
        jobId,
        platform,
        artifactPath
      );

      await publishLog(
        jobId,
        `artifact detected: ${f}`
      );

    }

  }

}

/* state transition */

async function transition(
  jobId,
  nextState
) {

  const rows = await query(
    `
    SELECT status
    FROM jobs
    WHERE job_id=?
    `,
    [jobId]
  );

  if (!rows || rows.length === 0)
    throw new Error("job not found");

  const current =
    rows[0].status;

  if (!isValidTransition(
    current,
    nextState
  )) {

    await publishLog(
      jobId,
      `invalid transition ${current} -> ${nextState}`
    );

    return;

  }

  const progress =
    getProgress(nextState);

  await publishStatus(
    jobId,
    nextState,
    progress
  );

  await query(
    `
    UPDATE jobs
    SET
      status=?,
      progress=?,
      updated_at=NOW()
    WHERE job_id=?
    `,
    [
      nextState,
      progress,
      jobId
    ]
  );

}

/* heartbeat DB update */

async function updateHeartbeat(jobId) {

  await query(
    `
    UPDATE jobs
    SET heartbeat_at=NOW()
    WHERE job_id=?
    `,
    [jobId]
  );

}

/* main build */

async function runBuild(job) {

  return new Promise(async (resolve) => {

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

    let heartbeatTimer = null;
    let heartbeatDB = null;

    try {

      await query(
        `
        UPDATE jobs
        SET
          worker_id=?,
          build_host=?,
          updated_at=NOW()
        WHERE job_id=?
        `,
        [
          WORKER_ID,
          BUILD_HOST,
          jobId
        ]
      );

      await transition(jobId, STATES.PREPARING);

      heartbeatTimer =
        startHeartbeat(jobId);

      heartbeatDB =
        setInterval(
          () => updateHeartbeat(jobId),
          10000
        );

      const workerRoot =
        process.env.WORKER_ROOT ||
        process.cwd();

      const scriptsDir =
        path.join(workerRoot, "scripts");

      let script;

      if (platform === "android")
        script = path.join(scriptsDir, "build_android_fastlane.sh");

      if (platform === "ios")
        script = path.join(scriptsDir, "build_ios_fastlane.sh");

      if (!script || !fs.existsSync(script)) {

        throw new Error(
          `build script not found for platform: ${platform}`
        );

      }

      await transition(jobId, STATES.PATCHING);

      await publishLog(
        jobId,
        `workspace: ${workspace}`
      );

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

        const text =
          data.toString();

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

              await query(
                `
                UPDATE jobs
                SET artifact_dir=?
                WHERE job_id=?
                `,
                [
                  path.relative(
                    CI_ROOT,
                    candidate
                  ),
                  jobId
                ]
              );

            }

          }

        }

      });

      proc.stderr.on("data", async data => {

        await publishLog(
          jobId,
          data.toString()
        );

      });

      proc.on("error", async err => {

        await publishLog(
          jobId,
          `spawn error: ${err.message}`
        );

        clearInterval(heartbeatDB);
        stopHeartbeat(heartbeatTimer);

        cleanupWorkspace(workspace);

        resolve({
          status: "failed",
          progress: 0
        });

      });

      const timeout = setTimeout(() => {

        proc.kill("SIGKILL");

      }, 30 * 60 * 1000);

      proc.on("close", async code => {

        clearTimeout(timeout);

        unregisterBuild(jobId);

        clearInterval(heartbeatDB);
        stopHeartbeat(heartbeatTimer);

        if (code === 0) {

          await transition(jobId, STATES.SIGNING);
          await transition(jobId, STATES.UPLOADING);

          await scanArtifacts(
            jobId,
            platform,
            artifactDir
          );

          await transition(jobId, STATES.FINISHED);

          await query(
            `
            UPDATE jobs
            SET finished_at=NOW()
            WHERE job_id=?
            `,
            [jobId]
          );

          cleanupWorkspace(workspace);

          resolve({
            status: STATES.FINISHED,
            progress: getProgress(STATES.FINISHED)
          });

        } else {

          await query(
            `
            UPDATE jobs
            SET
              status='failed',
              error_reason='build failed',
              finished_at=NOW()
            WHERE job_id=?
            `,
            [jobId]
          );

          cleanupWorkspace(workspace);

          resolve({
            status: STATES.FAILED,
            progress: getProgress(STATES.FAILED)
          });

        }

      });

    } catch (err) {

      await publishLog(
        jobId,
        err.message
      );

      await query(
        `
        UPDATE jobs
        SET
          status='failed',
          error_reason=?,
          finished_at=NOW()
        WHERE job_id=?
        `,
        [
          err.message,
          jobId
        ]
      );

      clearInterval(heartbeatDB);
      stopHeartbeat(heartbeatTimer);

      cleanupWorkspace(workspace);

      resolve({
        status: STATES.FAILED,
        progress: getProgress(STATES.FAILED)
      });

    }

  });

}

module.exports = { runBuild };