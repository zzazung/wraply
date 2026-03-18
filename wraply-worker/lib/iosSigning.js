const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const WRAPLY_ROOT =
  process.env.WRAPLY_ROOT || path.resolve(process.cwd(), "..");

const SIGNING_ROOT =
  path.join(WRAPLY_ROOT, "signing", "ios");

const TENANT_ROOT =
  path.join(SIGNING_ROOT, "tenants");

const KEYCHAIN_DIR =
  path.join(SIGNING_ROOT, "keychains");

/* ---------- helpers ---------- */

function ensureDir(dir) {
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true });
}

function run(cmd, args, env = {}) {
  return execFileSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...env }
  });
}

/* ---------- paths ---------- */

function getTenantDir(tenantId) {
  return path.join(TENANT_ROOT, tenantId);
}

function getCertPath(tenantId) {
  return path.join(getTenantDir(tenantId), "cert.p12");
}

function getCertPassPath(tenantId) {
  return path.join(getTenantDir(tenantId), "cert.pass");
}

function hasCert(tenantId) {
  return fs.existsSync(getCertPath(tenantId));
}

/* 🔥 추가: identity 체크 */
function hasIdentity(keychain) {

  try {

    const out = execFileSync(
      "security",
      ["find-identity", "-v", "-p", "codesigning", keychain],
      { stdio: ["ignore", "pipe", "ignore"] } // 🔥 stderr 차단
    ).toString();

    const match = out.match(/([0-9]+) valid identities found/);

    if (!match) return false;

    return parseInt(match[1], 10) > 0;

  } catch {
    return false;
  }

}

/* 🔥 추가: p12 export */
function exportP12FromKeychain(
  tenantId,
  keychain,
  password = "wraply-temp"
) {

  const certPath = getCertPath(tenantId);
  const passPath = getCertPassPath(tenantId);

  ensureDir(getTenantDir(tenantId));

  console.log("[iosSigning] export p12:", certPath);

  run("security", [
    "export",
    "-k",
    keychain,
    "-t",
    "identities",
    "-f",
    "pkcs12",
    "-o",
    certPath,
    "-P",
    password
  ]);

  fs.writeFileSync(passPath, password);

}

/* ---------- 이하 기존 코드 그대로 ---------- */

function resolveApiKeyPath(apiKeyPath) {
  if (path.isAbsolute(apiKeyPath))
    return apiKeyPath;
  return path.join(WRAPLY_ROOT, apiKeyPath);
}

function getProfileDir(tenantId, bundleId) {
  return path.join(getTenantDir(tenantId), "profiles", bundleId);
}

function getProfilePath(tenantId, bundleId, uuid) {
  const dir = getProfileDir(tenantId, bundleId);
  if (!uuid) return dir;
  return path.join(dir, `${uuid}.mobileprovision`);
}

function hasProfile(tenantId, bundleId) {

  const dir = getProfileDir(tenantId, bundleId);

  if (!fs.existsSync(dir)) return false;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".mobileprovision"));

  return files.length > 0;
}

function getLatestProfile(tenantId, bundleId) {

  const dir = getProfileDir(tenantId, bundleId);

  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".mobileprovision"));

  if (files.length === 0) return null;

  return path.join(dir, files[0]);
}

/* ---------- WWDR ---------- */

function installWWDR(keychain) {

  const certPath =
    path.join(__dirname, "AppleWWDRCAG3.cer");

  if (!fs.existsSync(certPath)) return;

  run("security", [
    "import",
    certPath,
    "-k",
    keychain,
    "-T",
    "/usr/bin/codesign",
    "-T",
    "/usr/bin/security"
  ]);

  try {
    run("security", [
      "import",
      certPath,
      "-k",
      "/Library/Keychains/System.keychain",
      "-T",
      "/usr/bin/codesign"
    ]);

    run("security", [
      "add-trusted-cert",
      "-d",
      "-k",
      "/Library/Keychains/System.keychain",
      certPath
    ]);
  } catch {}
}

/* ---------- keychain ---------- */

function createTempKeychain(jobId) {

  ensureDir(KEYCHAIN_DIR);

  const keychain =
    path.join(KEYCHAIN_DIR, `wraply-${jobId}.keychain-db`);

  const password = "wraply-temp";

  run("security", ["create-keychain", "-p", password, keychain]);
  run("security", ["unlock-keychain", "-p", password, keychain]);
  run("security", ["set-keychain-settings", "-lut", "21600", keychain]);

  // run("security", [
  //   "list-keychains",
  //   "-d",
  //   "user",
  //   "-s",
  //   keychain,
  //   `${process.env.HOME}/Library/Keychains/login.keychain-db`,
  //   "/Library/Keychains/System.keychain"
  // ]);

  run("security", [
    "list-keychains",
    "-d",
    "user",
    "-s",
    keychain
  ]);

  run("security", [
    "default-keychain",
    "-s",
    keychain
  ]);

  // run("security", [
  //   "set-key-partition-list",
  //   "-S",
  //   "apple-tool:,apple:,codesign:",
  //   "-s",
  //   "-k",
  //   password,
  //   keychain
  // ]);

  installWWDR(keychain);


  return { keychain, password };
}

function deleteTempKeychain(keychainPath) {

  if (!keychainPath) return;

  try {
    execFileSync("security", [
      "delete-keychain",
      keychainPath
    ]);
  } catch {}
}

/* ---------- cert import ---------- */

function importP12ToKeychain(tenantId, keychain, keychainPassword) {

  const certPath = getCertPath(tenantId);
  const passPath = getCertPassPath(tenantId);

  if (!fs.existsSync(certPath))
    throw new Error("p12 not found");

  const certPass =
    fs.existsSync(passPath)
      ? fs.readFileSync(passPath, "utf8")
      : "";

  run("security", [
    "import",
    certPath,
    "-k",
    keychain,
    "-P",
    certPass,
    "-T",
    "/usr/bin/codesign",
    "-T",
    "/usr/bin/security"
  ]);

  run("security", [
    "set-key-partition-list",
    "-S",
    "apple-tool:,apple:,codesign:",
    "-s",
    "-k",
    keychainPassword,
    keychain
  ]);
}

/* ---------- profile ---------- */

function saveProfileToStorage(tenantId, bundleId, uuid, profilePath) {

  const destDir = getProfileDir(tenantId, bundleId);

  ensureDir(destDir);

  const destPath =
    path.join(destDir, `${uuid}.mobileprovision`);

  fs.copyFileSync(profilePath, destPath);

  return destPath;
}

/* ---------- validate ---------- */

function validateApiKey(apiKeyPath) {

  const resolved = resolveApiKeyPath(apiKeyPath);

  if (!fs.existsSync(resolved))
    throw new Error("ASC key not found");

  return resolved;
}

/* ---------- main ---------- */

async function ensureIOSSigning({

  jobId,
  tenantId,
  bundleId,
  mode,
  apiKeyId,
  apiIssuerId,
  apiKeyPath

}) {

  ensureDir(SIGNING_ROOT);
  ensureDir(getTenantDir(tenantId));

  if (mode !== "api_key")
    throw new Error("Only api_key mode supported");

  const resolvedKeyPath =
    validateApiKey(apiKeyPath);

  const { keychain, password } =
    createTempKeychain(jobId);

  const certExists = hasCert(tenantId);

  if (certExists) {

    importP12ToKeychain(
      tenantId,
      keychain,
      password
    );

  }

  return {
    keychainPath: keychain,
    hasCert: certExists,
    p12Path: certExists ? getCertPath(tenantId) : null,
    p12Password: certExists
      ? fs.readFileSync(getCertPassPath(tenantId), "utf8")
      : null,
    env: {
      ASC_KEY_ID: apiKeyId,
      ASC_ISSUER_ID: apiIssuerId,
      ASC_KEY_PATH: resolvedKeyPath,
      FASTLANE_KEYCHAIN_PATH: keychain,
      FASTLANE_KEYCHAIN_PASSWORD: password
    }
  };

}

module.exports = {
  ensureIOSSigning,
  deleteTempKeychain,
  exportP12FromKeychain, // ✅ 추가
  hasIdentity,           // ✅ 추가
  hasCert,
  hasProfile,
  getProfilePath,
  getLatestProfile,
  saveProfileToStorage,
  getCertPath,
  getCertPassPath
};