const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const os = require("os");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const { query } = require("@wraply/shared/db");

const { STATES, getProgress, isValidTransition } = require("@wraply/shared/job/jobState");

const { publishLog, publishStatus } = require("../bus/logBus");
const { registerBuild, unregisterBuild } = require("./buildRegistry");
const { startHeartbeat, stopHeartbeat } = require("../bus/heartbeatBus");

const { ensureAndroidSigning } = require("../lib/androidSigning");
const {
  ensureIOSSigning,
  deleteTempKeychain,
  exportP12FromKeychain,   // ✅ 추가
  hasIdentity,             // ✅ 추가
  hasCert,
  hasProfile,
  getLatestProfile,
  saveProfileToStorage,
  getCertPath,
  getCertPassPath
} = require("../lib/iosSigning");

const { applyAndroidPatches } = require("../patch/android");
const { applyIOSPatches } = require("../patch/ios");

const WRAPLY_ROOT = process.env.WRAPLY_ROOT || path.resolve(process.cwd(), "..");

const PROJECT_ROOT = path.join(WRAPLY_ROOT, "projects");
const ARTIFACT_ROOT = path.join(WRAPLY_ROOT, "artifacts");
const LOG_ROOT = path.join(WRAPLY_ROOT, "logs");

const WORKER_ID = process.env.WORKER_ID || `${os.hostname()}-${process.pid}`;
const BUILD_HOST = os.hostname();

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log("[worker] create dir:", dir);
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanupWorkspace(dir) {
  console.log("[worker] cleanup workspace:", dir);
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest("hex");
}

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*m/g, "")
}

function parseProfilePath(text) {

  const match = text.match(/WRAPLY_PROFILE_PATH=(.+)/);

  if (!match) return null;

  return stripAnsi(match[1].trim());

}

function parseProfileUUID(text) {

  const match = text.match(/WRAPLY_PROFILE_UUID=(.+)/);

  if (!match) return null;

  return stripAnsi(match[1].trim());

}

/**
 * artifact 저장 (tenant isolation 적용)
 */
async function saveArtifact(jobId, tenantId, platform, filePath, versionName, versionCode) {

  if (!fs.existsSync(filePath)) {
    console.error("[worker] artifact file not found:", filePath);
    return;
  }

  const stat = fs.statSync(filePath);
  const name = path.basename(filePath);

  const versionDir =
    versionName && versionCode
      ? `${versionName}_${versionCode}`
      : "unknown";

  const artifactDir = path.join(
    ARTIFACT_ROOT,
    tenantId,
    platform,
    jobId,
    versionDir
  );

  ensureDir(artifactDir);

  const dest = path.join(artifactDir, name);

  console.log("[worker] copy artifact:", filePath, "->", dest);

  fs.copyFileSync(filePath, dest);

  const checksum = sha256(dest);
  const relPath = path.relative(WRAPLY_ROOT, dest);

  let type = null;

  if (name.endsWith(".apk")) type = "apk";
  if (name.endsWith(".aab")) type = "aab";
  if (name.endsWith(".ipa")) type = "ipa";

  await query(`
    INSERT INTO artifacts
    (id, tenant_id, job_id, platform, type, name, path, size, checksum, version_name, version_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    uuidv4(),
    tenantId,
    jobId,
    platform,
    type,
    name,
    relPath,
    stat.size,
    checksum,
    versionName,
    versionCode
  ]);

}

async function transition(jobId, tenantId, nextState) {

  console.log("[worker] transition query", {
    jobId,
    tenantId,
    nextState
  });

  const rows = await query(
    `SELECT status FROM jobs WHERE job_id=? AND tenant_id=?`,
    [jobId, tenantId]
  );

  if (!rows || rows.length === 0) {
    console.error("[worker] job not found:", jobId);
    return;
  }

  const current = rows[0].status;

  if (!isValidTransition(current, nextState)) {
    await publishLog(jobId, tenantId, `invalid transition ${current} -> ${nextState}`);
    return;
  }

  const progress = getProgress(nextState);

  await publishStatus(jobId, tenantId, nextState, progress);

  const result = await query(
    `
    UPDATE jobs
    SET status=?, progress=?, updated_at=NOW()
    WHERE job_id=? AND tenant_id=?
  `,
    [
      nextState,
      progress,
      jobId,
      tenantId
    ]
  );

  console.log("[worker] update result", JSON.stringify(result));

}

async function updateHeartbeat(jobId, tenantId) {

  await query(
    `UPDATE jobs SET heartbeat_at=NOW() WHERE job_id=? AND tenant_id=?`,
    [jobId, tenantId]
  );

}

async function runBuild(job, handler) {

  const { jobId, tenantId, platform, settings } = job;

  /* ---------------- settings parse ---------------- */

  const base = settings?.base || {};
  const target = settings?.target || {};
  const config = target?.config || {};

  if (!target?.type) {
    throw new Error("Invalid settings: target.type missing");
  }

  const appName = base.appName;
  const url = base.url;

  const packageName =
    config.packageName || base.packageName;

  const safeName =
    `${(packageName || "app").replace(/\./g, "_")}_${jobId}`;

  /* ---------------- log setup ---------------- */

  const logDir = path.join(LOG_ROOT, tenantId, jobId);
  ensureDir(logDir);

  const logFile = path.join(logDir, "build.log");

  await query(`
    UPDATE jobs
    SET log_path=?, updated_at=NOW()
    WHERE job_id=? AND tenant_id=?
  `, [
    path.relative(WRAPLY_ROOT, logFile),
    jobId,
    tenantId
  ]);

  function writeLog(text) {

    const clean = stripAnsi(text);
    const line = `[${new Date().toISOString()}] ${clean}\n`;

    try {
      fs.appendFileSync(logFile, line);
    } catch (e) {
      console.error("[worker] log write fail:", e.message);
    }

  }

  /* ---------------- workspace ---------------- */

  const workspaceRoot = path.join(
    PROJECT_ROOT,
    tenantId,
    platform,
    safeName,
    jobId
  );

  const workspace = path.join(workspaceRoot, "source");

  ensureDir(workspace);
  ensureDir(LOG_ROOT);

  /* ---------------- context ---------------- */

  const ctx = {
    jobId,
    tenantId,
    platform,
    settings,
    base,
    config,
    workspace,
    safeName,
    packageName,
    appName,
    url,

    /* 🔥 version 상태 유지 */
    versionName: null,
    versionCode: null,

    /* 🔥 log 함수 */
    writeLog
  };

  /* ---------------- lifecycle ---------------- */

  let heartbeatTimer = null;
  let heartbeatDB = null;

  let cleanupData = null;

  try {

    await query(
      `
      UPDATE jobs
      SET worker_id=?, build_host=?, updated_at=NOW()
      WHERE job_id=? AND tenant_id=?
      `,
      [WORKER_ID, BUILD_HOST, jobId, tenantId]
    );

    await transition(jobId, tenantId, STATES.PREPARING);

    heartbeatTimer = startHeartbeat(jobId);
    heartbeatDB = setInterval(
      () => updateHeartbeat(jobId, tenantId),
      10000
    );

    /* ---------------- PATCH ---------------- */

    await transition(jobId, tenantId, STATES.PATCHING);

    const handlerResult = await handler.run(ctx);

    cleanupData = handlerResult;

    /* ---------------- BUILD ---------------- */

    await transition(jobId, tenantId, STATES.BUILDING);

    const buildResult = await spawnBuild({
      ...ctx,
      signingEnv: handlerResult?.signingEnv || {}
    });

    /* ---------------- SUCCESS ---------------- */

    await transition(jobId, tenantId, STATES.FINISHED);

    await query(
      `
      UPDATE jobs
      SET finished_at=NOW()
      WHERE job_id=? AND tenant_id=?
      `,
      [jobId, tenantId]
    );

    return buildResult;

  }
  catch (err) {

    console.error("[runBuild] error:", err);

    await publishLog(jobId, tenantId, err.message);

    await transition(jobId, tenantId, STATES.FAILED);

    return {
      status: STATES.FAILED,
      progress: getProgress(STATES.FAILED)
    };

  }
  finally {

    /* 🔥 cleanup은 항상 실행 */
    try {
      if (handler.cleanup) {
        await handler.cleanup(cleanupData);
      }
    } catch (e) {
      console.error("[cleanup error]", e.message);
    }

    clearInterval(heartbeatDB);
    stopHeartbeat(heartbeatTimer);

    cleanupWorkspace(workspaceRoot);

  }

}

async function spawnBuild(ctx) {

  const {
    jobId,
    tenantId,
    platform,
    safeName,
    packageName,
    appName,
    url,
    signingEnv
  } = ctx;

  const workerRoot = path.resolve(__dirname, "..");
  const scriptsDir = path.join(workerRoot, "scripts");

  const buildScript =
    platform === "android"
      ? path.join(scriptsDir, "build_android_fastlane.sh")
      : path.join(scriptsDir, "build_ios_fastlane.sh");

  return new Promise((resolve, reject) => {

    const proc = spawn(
      "bash",
      [
        buildScript,
        jobId,
        tenantId,
        safeName,
        packageName || "",
        appName || "",
        url || ""
      ],
      {
        cwd: WRAPLY_ROOT,
        env: {
          ...process.env,
          ...signingEnv,
          WRAPLY_ROOT
        },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    registerBuild(jobId, proc);

    let stdoutBuffer = "";

    proc.stdout.on("data", d => {

      stdoutBuffer += d.toString();

      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop();

      for (const line of lines) {

        const text = line.trim();
        if (!text) continue;

        handleLine(ctx, text);

      }

    });

    proc.stderr.on("data", d => {
      console.log("[stderr]", d.toString());
    });

    proc.on("close", code => {
      /* 🔥 마지막 남은 로그 처리 */
      const text = stdoutBuffer.trim();
      if (text) handleLine(ctx, text);

      unregisterBuild(jobId);

      if (code === 0) {
        resolve({
          status: STATES.FINISHED,
          progress: getProgress(STATES.FINISHED)
        });
      }
      else {
        reject(new Error(`build failed (${code})`));
      }

    });

  });

}

function handleLine(ctx, text) {

  const { jobId, tenantId, platform, writeLog } = ctx;

  writeLog(text);

  publishLog(jobId, tenantId, text).catch(()=>{});

  const stateMatch = text.match(/WRAPLY_STATE=(\w+)/);

  if (stateMatch) {
    const state = stateMatch[1].toLowerCase();
    transition(jobId, tenantId, state);
  }

  if (text.includes("OUTPUT_DIR=")) {
    const rel = text.split("=")[1].trim();
    const candidate = path.join(WRAPLY_ROOT, rel);

    const versionPart = path.basename(candidate);
    const v = versionPart.split("_");

    if (v.length === 2) {
      ctx.versionName = v[0];
      ctx.versionCode = parseInt(v[1], 10);
    }
  }

  if (text.includes("WRAPLY_ARTIFACT=")) {

    const filePath = text.split("=")[1].trim();

    saveArtifact(
      jobId,
      tenantId,
      platform,
      filePath,
      ctx.versionName,
      ctx.versionCode
    );

  }

}

module.exports = { runBuild };