const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const { query } = require("@wraply/shared/db");

/* ---------- root ---------- */

const WRAPLY_ROOT =
  process.env.WRAPLY_ROOT || path.resolve(process.cwd(), "..");

const SIGNING_ROOT = path.join(WRAPLY_ROOT, "signing");

/* ---------- helpers ---------- */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function randomPass() {
  return crypto.randomBytes(24).toString("hex");
}

function sha256File(file) {
  const buffer = fs.readFileSync(file);
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}

/* ---------- fingerprint ---------- */

function getFingerprint(keystorePath, storePass) {

  const output = execFileSync("keytool", [
    "-list",
    "-v",
    "-keystore",
    keystorePath,
    "-storepass",
    storePass
  ]).toString();

  const sha1 =
    output.match(/SHA1:\s*([A-F0-9:]+)/)?.[1] || null;

  const sha256 =
    output.match(/SHA256:\s*([A-F0-9:]+)/)?.[1] || null;

  return { sha1, sha256 };

}

/* ---------- ensure signing ---------- */

async function ensureAndroidSigning(packageName, safeName) {

  /* ---------- DB lookup ---------- */

  const rows = await query(`
    SELECT *
    FROM android_signing_keys
    WHERE package_name=?
    LIMIT 1
  `,[packageName]);

  if (rows && rows.length > 0) {

    const s = rows[0];

    return {
      keystorePath: path.join(SIGNING_ROOT, s.keystore_path),
      alias: s.key_alias,
      storePass: s.store_pass_enc,
      keyPass: s.key_pass_enc
    };

  }

  /* ---------- path ---------- */

  const signingDir = path.join(
    SIGNING_ROOT,
    "android",
    packageName
  );

  ensureDir(signingDir);

  const keystorePath =
    path.join(signingDir, "managed.jks");

  const metadataPath =
    path.join(signingDir, "metadata.json");

  /* ---------- metadata recovery ---------- */

  if (fs.existsSync(metadataPath)) {

    console.log("[signing] metadata recovery");

    const meta = JSON.parse(
      fs.readFileSync(metadataPath).toString()
    );

    const relPath = path.join(
      "android",
      packageName,
      "managed.jks"
    );

    await query(`
      INSERT INTO android_signing_keys
      (
        id,
        project_id,
        tenant_id,
        safe_name,
        package_name,
        mode,
        keystore_path,
        keystore_sha256,
        key_alias,
        store_pass_enc,
        key_pass_enc,
        fingerprint_sha1,
        fingerprint_sha256,
        version,
        is_active,
        created_at,
        updated_at
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        'managed',
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        NOW(),
        NOW()
      )
    `,[
      uuidv4(),
      null,
      "default",
      safeName,
      packageName,
      relPath,
      meta.keystore_sha256,
      meta.alias,
      meta.storePass,
      meta.keyPass,
      meta.sha1,
      meta.sha256,
      1,
      1
    ]);

    return {
      keystorePath,
      alias: meta.alias,
      storePass: meta.storePass,
      keyPass: meta.keyPass
    };

  }

  /* ---------- stale keystore ---------- */

  if (fs.existsSync(keystorePath)) {

    console.log(
      "[signing] stale keystore detected → removing"
    );

    fs.unlinkSync(keystorePath);

  }

  /* ---------- generate ---------- */

  const storePass = randomPass();
  const keyPass = randomPass();
  const alias = "wraply";

  console.log(
    "[signing] generating keystore:",
    keystorePath
  );

  execFileSync("keytool",[
    "-genkeypair",
    "-v",
    "-keystore",
    keystorePath,
    "-alias",
    alias,
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-storetype",
    "JKS",
    "-storepass",
    storePass,
    "-keypass",
    keyPass,
    "-dname",
    "CN=Wraply,O=Wraply,C=KR"
  ],{stdio:"inherit"});

  /* ---------- fingerprint ---------- */

  const keystoreSha = sha256File(keystorePath);

  const { sha1, sha256 } =
    getFingerprint(keystorePath, storePass);

  const relPath = path.join(
    "android",
    packageName,
    "managed.jks"
  );

  /* ---------- DB insert ---------- */

  await query(`
    INSERT INTO android_signing_keys
    (
      id,
      project_id,
      tenant_id,
      safe_name,
      package_name,
      mode,
      keystore_path,
      keystore_sha256,
      key_alias,
      store_pass_enc,
      key_pass_enc,
      fingerprint_sha1,
      fingerprint_sha256,
      version,
      is_active,
      created_at,
      updated_at
    )
    VALUES
    (
      ?,
      ?,
      ?,
      ?,
      ?,
      'managed',
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      NOW(),
      NOW()
    )
  `,[
    uuidv4(),
    null,
    "default",
    safeName,
    packageName,
    relPath,
    keystoreSha,
    alias,
    storePass,
    keyPass,
    sha1,
    sha256,
    1,
    1
  ]);

  /* ---------- metadata save ---------- */

  fs.writeFileSync(
    metadataPath,
    JSON.stringify(
      {
        alias,
        storePass,
        keyPass,
        sha1,
        sha256,
        keystore_sha256: keystoreSha,
        created: new Date().toISOString()
      },
      null,
      2
    )
  );

  return {
    keystorePath,
    alias,
    storePass,
    keyPass
  };

}

/* ---------- get signing info ---------- */

async function getAndroidSigning(packageName) {

  const rows = await query(`
    SELECT *
    FROM android_signing_keys
    WHERE package_name=?
    LIMIT 1
  `,[packageName]);

  if (!rows || rows.length === 0)
    return null;

  const s = rows[0];

  return {
    keystorePath: path.join(
      SIGNING_ROOT,
      s.keystore_path
    ),
    alias: s.key_alias,
    sha1: s.fingerprint_sha1,
    sha256: s.fingerprint_sha256
  };

}

module.exports = {
  ensureAndroidSigning,
  getAndroidSigning
};