const path = require("path");
const fs = require("fs");
const os = require("os");

const WRAPLY_ROOT =
  process.env.WRAPLY_ROOT || path.resolve(process.cwd(), "..");

/*
CI Sandbox Root

/tmp 사용 이유
- macOS / Linux 공통
- 고속 디스크 접근
- reboot 시 자동 정리
*/

const SANDBOX_ROOT =
  process.env.WRAPLY_SANDBOX ||
  path.join(os.tmpdir(), "wraply");

/* ---------- helpers ---------- */

function ensureDir(dir) {

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

}

function safeRemove(dir) {

  try {
    fs.rmSync(dir, {
      recursive: true,
      force: true
    });
  }
  catch {}

}

/* ---------- sandbox path ---------- */

function getSandboxRoot(jobId) {

  return path.join(
    SANDBOX_ROOT,
    "jobs",
    jobId
  );

}

function getSourceDir(jobId) {

  return path.join(
    getSandboxRoot(jobId),
    "source"
  );

}

function getBuildDir(jobId) {

  return path.join(
    getSandboxRoot(jobId),
    "build"
  );

}

function getLogDir(jobId) {

  return path.join(
    getSandboxRoot(jobId),
    "logs"
  );

}

function getTmpDir(jobId) {

  return path.join(
    getSandboxRoot(jobId),
    "tmp"
  );

}

/* ---------- sandbox create ---------- */

function createSandbox(jobId) {

  if (!jobId) {
    throw new Error("jobId required");
  }

  const root = getSandboxRoot(jobId);

  const source = getSourceDir(jobId);
  const build = getBuildDir(jobId);
  const logs = getLogDir(jobId);
  const tmp = getTmpDir(jobId);

  ensureDir(root);
  ensureDir(source);
  ensureDir(build);
  ensureDir(logs);
  ensureDir(tmp);

  return {
    root,
    source,
    build,
    logs,
    tmp
  };

}

/* ---------- sandbox cleanup ---------- */

function cleanupSandbox(jobId) {

  const root = getSandboxRoot(jobId);

  console.log("[sandbox] cleanup:", root);

  safeRemove(root);

}

/* ---------- stale sandbox cleanup ---------- */

function cleanupStaleSandboxes(maxAgeMinutes = 120) {

  const jobsRoot =
    path.join(SANDBOX_ROOT, "jobs");

  if (!fs.existsSync(jobsRoot)) {
    return;
  }

  const now = Date.now();

  const list = fs.readdirSync(jobsRoot);

  for (const jobId of list) {

    const dir = path.join(jobsRoot, jobId);

    try {

      const stat = fs.statSync(dir);

      const ageMinutes =
        (now - stat.mtimeMs) / 60000;

      if (ageMinutes > maxAgeMinutes) {

        console.log(
          "[sandbox] removing stale:",
          jobId
        );

        safeRemove(dir);

      }

    }
    catch {}

  }

}

/* ---------- debug info ---------- */

function getSandboxInfo(jobId) {

  const root = getSandboxRoot(jobId);

  if (!fs.existsSync(root)) {
    return null;
  }

  return {
    root,
    source: getSourceDir(jobId),
    build: getBuildDir(jobId),
    logs: getLogDir(jobId),
    tmp: getTmpDir(jobId)
  };

}

module.exports = {

  createSandbox,
  cleanupSandbox,
  cleanupStaleSandboxes,

  getSandboxRoot,
  getSourceDir,
  getBuildDir,
  getLogDir,
  getTmpDir,

  getSandboxInfo

};