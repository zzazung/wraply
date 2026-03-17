const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const WRAPLY_ROOT =
  process.env.WRAPLY_ROOT || path.resolve(process.cwd(), "..");

const SIGNING_ROOT =
  path.join(WRAPLY_ROOT, "signing", "ios");

const CERT_DIR =
  path.join(SIGNING_ROOT, "certs");

const PROFILE_DIR =
  path.join(SIGNING_ROOT, "profiles");

const KEYCHAIN_DIR =
  path.join(SIGNING_ROOT, "keychains");

const LOCK_FILE =
  path.join(SIGNING_ROOT, ".signing.lock");

/* ---------- helpers ---------- */

function ensureDir(dir) {

  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true });

}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* ---------- signing lock ---------- */

async function acquireLock() {

  ensureDir(SIGNING_ROOT);

  while (fs.existsSync(LOCK_FILE)) {
    await sleep(1000);
  }

  fs.writeFileSync(
    LOCK_FILE,
    process.pid.toString()
  );

}

function releaseLock() {

  if (fs.existsSync(LOCK_FILE))
    fs.unlinkSync(LOCK_FILE);

}

/* ---------- WWDR certificate ---------- */

function ensureWWDR() {

  try {

    execFileSync(
      "security",
      [
        "find-certificate",
        "-c",
        "Apple Worldwide Developer Relations Certification Authority"
      ],
      { stdio: "ignore" }
    );

  } catch {

    console.log("[iosSigning] install WWDR certificate");

    const cert =
      path.join(SIGNING_ROOT, "AppleWWDRCAG3.cer");

    execFileSync(
      "curl",
      [
        "-L",
        "-o",
        cert,
        "https://developer.apple.com/certificationauthority/AppleWWDRCAG3.cer"
      ],
      { stdio: "inherit" }
    );

    execFileSync(
      "security",
      [
        "add-trusted-cert",
        "-d",
        "-r",
        "trustRoot",
        "-k",
        `${process.env.HOME}/Library/Keychains/login.keychain-db`,
        cert
      ],
      { stdio: "inherit" }
    );

  }

}

/* ---------- certificate ---------- */

function hasCertificate() {

  if (!fs.existsSync(CERT_DIR))
    return false;

  const files =
    fs.readdirSync(CERT_DIR);

  return files.some(f => f.endsWith(".cer"));

}

function createCertificate({
  appleId,
  teamId
}) {

  console.log("[iosSigning] create certificate");

  execFileSync(
    "fastlane",
    [
      "cert",
      "--development",
      "--team_id",
      teamId
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        FASTLANE_USER: appleId,
        FASTLANE_TEAM_ID: teamId
      }
    }
  );

}

/* ---------- app id ---------- */

function ensureAppId({
  bundleId,
  appName,
  appleId,
  teamId
}) {

  console.log("[iosSigning] ensure app id:", bundleId);

  try {

    execFileSync(
      "fastlane",
      [
        "produce",
        "--username",
        appleId,
        "--app_identifier",
        bundleId,
        "--app_name",
        appName,
        "--team_id",
        teamId,
        "--skip_itc"
      ],
      {
        stdio: "inherit"
      }
    );

  } catch (err) {

    console.log("[iosSigning] produce error");

    console.log(err.stdout?.toString() || err.message);

  }

}

/* ---------- provisioning ---------- */

function hasProvision(bundleId) {

  if (!fs.existsSync(PROFILE_DIR))
    return false;

  const files =
    fs.readdirSync(PROFILE_DIR);

  return files.some(f => f.includes(bundleId));

}

function createProvision({
  bundleId,
  appleId,
  teamId
}) {

  console.log("[iosSigning] create provisioning:", bundleId);

  execFileSync(
    "fastlane",
    [
      "sigh",
      "--development",
      "--app_identifier",
      bundleId,
      "--team_id",
      teamId
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        FASTLANE_USER: appleId,
        FASTLANE_TEAM_ID: teamId
      }
    }
  );

}

/* ---------- keychain ---------- */

function createTempKeychain(jobId) {

  ensureDir(KEYCHAIN_DIR);

  const keychain =
    path.join(
      KEYCHAIN_DIR,
      `wraply-${jobId}.keychain-db`
    );

  const password =
    "wraply-temp";

  console.log(
    "[iosSigning] create keychain:",
    keychain
  );

  execFileSync(
    "security",
    [
      "create-keychain",
      "-p",
      password,
      keychain
    ]
  );

  execFileSync(
    "security",
    [
      "unlock-keychain",
      "-p",
      password,
      keychain
    ]
  );

  execFileSync(
    "security",
    [
      "set-keychain-settings",
      "-lut",
      "21600",
      keychain
    ]
  );

  execFileSync(
    "security",
    [
      "list-keychains",
      "-d",
      "user",
      "-s",
      keychain,
      `${process.env.HOME}/Library/Keychains/login.keychain-db`,
      "/Library/Keychains/System.keychain"
    ]
  );

  execFileSync(
    "security",
    [
      "default-keychain",
      "-s",
      keychain
    ]
  );

  return keychain;

}

/* ---------- keychain cleanup ---------- */

function deleteTempKeychain(keychain) {

  if (!keychain)
    return;

  try {

    execFileSync(
      "security",
      [
        "delete-keychain",
        keychain
      ]
    );

  } catch {}

}

/* ---------- main ---------- */

async function ensureIOSSigning({

  jobId,
  bundleId,
  appleId,
  teamId,
  mode,
  apiKeyId,
  apiIssuerId,
  apiKeyPath

}) {

  if (!bundleId)
    throw new Error("bundleId missing");

  ensureDir(CERT_DIR);
  ensureDir(PROFILE_DIR);

  ensureWWDR();

  /* ---------- API KEY MODE ---------- */

  if (mode === "api_key") {

    console.log("[iosSigning] mode: api_key");

    const keychain =
      createTempKeychain(jobId);

    return {
      keychainPath: keychain,
      env: {
        ASC_KEY_ID: apiKeyId,
        ASC_ISSUER_ID: apiIssuerId,
        ASC_KEY_PATH: apiKeyPath
      }
    };

  }

  /* ---------- APPLE LOGIN MODE ---------- */

  await acquireLock();

  try {

    if (!hasCertificate()) {

      createCertificate({
        appleId,
        teamId
      });

    } else {

      console.log(
        "[iosSigning] reuse certificate"
      );

    }

    if (!hasProvision(bundleId)) {

      ensureAppId({
        bundleId,
        appName: bundleId.replace(/\./g, " "),
        appleId,
        teamId
      });

      createProvision({
        bundleId,
        appleId,
        teamId
      });

    } else {

      console.log(
        "[iosSigning] reuse provisioning:",
        bundleId
      );

    }

  } finally {

    releaseLock();

  }

  const keychain =
    createTempKeychain(jobId);

  return {
    keychainPath: keychain,
    env: {}
  };

}

module.exports = {
  ensureIOSSigning,
  deleteTempKeychain
};