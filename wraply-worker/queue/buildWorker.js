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

async function transition(jobId, nextState) {

  console.log("[worker] transition:", jobId, nextState);

  const rows = await query(
    `SELECT status FROM jobs WHERE job_id=?`,
    [jobId]
  );

  if (!rows || rows.length === 0) {
    console.error("[worker] job not found:", jobId);
    return;
  }

  const current = rows[0].status;

  if (!isValidTransition(current, nextState)) {
    await publishLog(jobId, `invalid transition ${current} -> ${nextState}`);
    return;
  }

  const progress = getProgress(nextState);

  await publishStatus(jobId, nextState, progress);

  await query(`
    UPDATE jobs
    SET status=?, progress=?, updated_at=NOW()
    WHERE job_id=?
  `, [
    nextState,
    progress,
    jobId
  ]);

}

async function updateHeartbeat(jobId) {
  await query(
    `UPDATE jobs SET heartbeat_at=NOW() WHERE job_id=?`,
    [jobId]
  );
}

async function runBuild(job) {

  return new Promise(async resolve => {

    console.log("[worker] runBuild job:", job);

    const {
      jobId,
      tenantId,
      platform,
      safeName,
      packageName,
      appName,
      url
    } = job;

    let versionName = null;
    let versionCode = null;

    let certCreated = false;
    let iosKeychain = null;

    /**
     * workspace (tenant isolation 적용)
     */
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

    let heartbeatTimer = null;
    let heartbeatDB = null;
    let signing = null;

    try {

      await query(`
        UPDATE jobs
        SET worker_id=?, build_host=?, updated_at=NOW()
        WHERE job_id=?
      `, [
        WORKER_ID,
        BUILD_HOST,
        jobId
      ]);

      await transition(jobId, STATES.PREPARING);

      heartbeatTimer = startHeartbeat(jobId);
      heartbeatDB = setInterval(() => updateHeartbeat(jobId), 10000);

      let signingEnv = {};

      /**
       * Android Signing
       */
      if (platform === "android") {

        signing =
          await ensureAndroidSigning(
            tenantId,
            packageName,
            safeName
          );

        signingEnv = {
          ANDROID_KEYSTORE_PATH: signing.keystorePath,
          ANDROID_KEY_ALIAS: signing.alias,
          ANDROID_STORE_PASSWORD: signing.storePass,
          ANDROID_KEY_PASSWORD: signing.keyPass
        };

      }

      /**
       * iOS Signing
       */
      else if (platform === "ios") {

        const signingRows = await query(`
          SELECT *
          FROM ios_signing_assets
          WHERE tenant_id=? AND bundle_id=?
          LIMIT 1
        `, [
          tenantId,
          packageName
        ]);

        if (!signingRows || signingRows.length === 0)
          throw new Error("iOS signing asset not found");

        const asset = signingRows[0];

        console.log("[worker] asset:", asset);

        signing = await ensureIOSSigning({
          jobId,
          tenantId,
          bundleId: packageName,
          // appleId: process.env.APPLE_ID,
          // teamId: process.env.DEVELOPER_TEAM_ID,
          mode: asset.mode,
          apiKeyId: asset.api_key_id,
          apiIssuerId: asset.api_issuer_id,
          apiKeyPath: asset.api_key_path
        });

        console.log("[worker] signing result:", signing);

        iosKeychain = signing.keychainPath;

        const certExists = hasCert(tenantId);
        const profileExists = hasProfile(tenantId, packageName);
        const certPath = getCertPath(tenantId);
        const passPath = getCertPassPath(tenantId);
        console.log("[worker] certExists:", certExists);
        console.log("[worker] profileExists:", profileExists);
        console.log("[worker] certPath:", certPath);
        console.log("[worker] passPath:", passPath);

        signingEnv = {
          ...signing.env,
          CODE_SIGN_IDENTITY: "Apple Distribution",
          HAS_CERT: certExists ? "true" : "false",
          HAS_PROFILE: profileExists ? "true" : "false",
          TEAM_ID: asset.team_id,
        };

        if (certExists) {
          signingEnv.P12_PATH = certPath;
          signingEnv.P12_PASSWORD = fs.existsSync(passPath)
            ? fs.readFileSync(passPath, "utf8")
            : "";
        }

        if (profileExists) {
          const profilePath = getLatestProfile(tenantId, packageName);
          signingEnv.PROFILE_PATH = profilePath;
          signingEnv.PROFILE_UUID =
            path.basename(profilePath).replace(".mobileprovision", "");
        }
      }

      const workerRoot = path.resolve(__dirname, "..");
      const scriptsDir = path.join(workerRoot, "scripts");

      const buildScript =
        platform === "android"
          ? path.join(scriptsDir, "build_android_fastlane.sh")
          : path.join(scriptsDir, "build_ios_fastlane.sh");

      await transition(jobId, STATES.BUILDING);

      console.log("[worker] spawn build start");
      console.log("[worker] build script:", buildScript);

      const proc = spawn(
        "bash",
        [
          buildScript,
          jobId,
          tenantId,
          safeName,
          packageName,
          appName,
          url
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

      console.log("[worker] spawn pid:", proc.pid);

      registerBuild(jobId, proc);

      proc.on("error", err => {
        console.error("[worker] spawn error:", err);
      });

      let stdoutBuffer = "";

      let profilePathTemp = null;
      let profileUUIDTemp = null;

      proc.stdout.on("data", async d => {

        // stdoutBuffer += stripAnsi(d.toString());
        stdoutBuffer += d.toString();

        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop();

        for (const line of lines) {

          const text = line.trim();
          if (!text) continue;

          console.log("[build]", text);

          await publishLog(jobId, text);

          if (text.includes("OUTPUT_DIR=")) {

            const rel = text.split("=")[1].trim();
            const candidate = path.join(WRAPLY_ROOT, rel);

            const versionPart = path.basename(candidate);
            const v = versionPart.split("_");

            if (v.length === 2) {
              versionName = v[0];
              versionCode = parseInt(v[1], 10);
            }

          }

          if (text.includes("WRAPLY_ARTIFACT=")) {

            const artifactPath = text.split("=")[1].trim();

            await saveArtifact(
              jobId,
              tenantId,
              platform,
              artifactPath,
              versionName,
              versionCode
            );

          }

          if (text.includes("WRAPLY_CERT_CREATED=true")) {
            certCreated = true;
          }

          if (text.includes("WRAPLY_PROFILE_PATH=")) {

            profilePathTemp = parseProfilePath(text);

          }

          if (text.includes("WRAPLY_PROFILE_UUID=")) {

            profileUUIDTemp = parseProfileUUID(text);

          }

          if (profilePathTemp && profileUUIDTemp) {

            try {
              saveProfileToStorage(
                tenantId,
                packageName,
                profileUUIDTemp,
                profilePathTemp
              );
            } catch (e) {
              console.error("[worker] profile save failed:", e.message);
            }

            profilePathTemp = null
            profileUUIDTemp = null

          }

        }

      });

      proc.stderr.on("data", d => {
        console.log("[build stderr]", d.toString());
      });

      proc.on("close", async code => {

        unregisterBuild(jobId);

        clearInterval(heartbeatDB);
        stopHeartbeat(heartbeatTimer);

        /* ---------- save certificate ---------- */

        if (platform === 'ios' && code === 0) {

          try {
            spawn("security", [
              "set-key-partition-list",
              "-S",
              "apple-tool:,apple:,codesign:",
              "-s",
              "-k",
              "wraply-temp",
              iosKeychain
            ]);
          } catch (e) {
            console.log("[worker] partition skip:", e.message);
          }

          const identityExists = hasIdentity(iosKeychain);

          console.log("[worker] identityExists:", identityExists);
          console.log("[worker] certCreated:", certCreated);

          if (identityExists && !hasCert(tenantId)) {

            console.log("[worker] exporting p12");

            try {

              exportP12FromKeychain(
                tenantId,
                iosKeychain,
                "wraply-temp"
              );

            } catch (e) {

              console.log("[worker] p12 export skipped:", e.message);

            }

          } else {

            console.log("[worker] skip p12 export");

          }

        }

        /* ---------- keychain cleanup ---------- */

        if (platform === 'ios') {

          spawn(
            "security",
            ["find-identity", "-v", "-p", "codesigning", iosKeychain],
            { stdio: "inherit" }
          );
          
        }

        if (iosKeychain)
          deleteTempKeychain(iosKeychain);

        /* ---------- 상태 처리 ---------- */

        if (code === 0) {

          await transition(jobId, STATES.FINISHED);

          await query(`
            UPDATE jobs
            SET finished_at=NOW()
            WHERE job_id=?
          `, [jobId]);

        }
        else {

          await transition(jobId, STATES.FAILED);

        }

        cleanupWorkspace(workspaceRoot);

        resolve({
          status: code === 0 ? STATES.FINISHED : STATES.FAILED,
          progress: getProgress(code === 0 ? STATES.FINISHED : STATES.FAILED)
        });

      });

    }
    catch (err) {

      await publishLog(jobId, err.message);

      if (iosKeychain)
        deleteTempKeychain(iosKeychain);

      await transition(jobId, STATES.FAILED);

      clearInterval(heartbeatDB);
      stopHeartbeat(heartbeatTimer);

      cleanupWorkspace(workspaceRoot);

      resolve({
        status: STATES.FAILED,
        progress: getProgress(STATES.FAILED)
      });

    }

  });

}
async function saveCertToStorage({ tenantId, bundleId, p12Path, password }) {

  console.log("[worker] save cert:", p12Path);

  const fileName = path.basename(p12Path);

  const destDir = path.join(
    WRAPLY_ROOT,
    "signing",
    "ios",
    "certs",
    tenantId
  );

  ensureDir(destDir);

  const destPath = path.join(destDir, fileName);

  fs.copyFileSync(p12Path, destPath);

  const relPath = path.relative(WRAPLY_ROOT, destPath);

  await query(`
    UPDATE ios_signing_assets
    SET certificate_name=?, p12_path=?, p12_password=?, updated_at=NOW()
    WHERE tenant_id=? AND bundle_id=?
  `, [
    fileName,
    relPath,
    password,
    tenantId,
    bundleId
  ]);

  console.log("[worker] cert saved:", relPath);
}

module.exports = { runBuild };