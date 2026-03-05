// lib/androidSigning.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { encrypt, decrypt } = require("./crypto");

const CI_ROOT = process.env.CI_ROOT || process.cwd();
const KEYTOOL_BIN = process.env.KEYTOOL_BIN || "keytool";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sha256File(filePath) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(filePath));
  return h.digest("hex");
}

function randPassword(len = 24) {
  // URL-safe-ish
  return crypto.randomBytes(len).toString("base64url").slice(0, len);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${cmd} failed (${code}): ${err || out}`));
    });
  });
}

function secureKeyDir(safeName) {
  return path.join(CI_ROOT, "secure", "android", "keys", safeName);
}

function secureUploadDir(jobId) {
  return path.join(CI_ROOT, "secure", "android", "uploads", jobId);
}

/**
 * DB에서 key 조회
 */
async function getSigningKey(pool, safeName) {
  const [rows] = await pool.query(
    "SELECT * FROM android_signing_keys WHERE safe_name=? LIMIT 1",
    [safeName]
  );
  return rows[0] || null;
}

/**
 * keyId로 키 조회
 *
 * @param {*} pool
 * @param {*} keyId
 * @returns { id, safe_name, package_name, mode, keystore_path, keystore_sha256, key_alias, store_pass_enc, key_pass_enc }
 */
async function getSigningKeyById(pool, keyId) {
  const [rows] = await pool.query(
    "SELECT * FROM android_signing_keys WHERE id=? LIMIT 1",
    [keyId]
  );
  return rows[0] || null;
}

/**
 * keyId로 material 반환
 *
 * @param {*} pool
 * @param {*} keyId
 * @returns { id, mode, keystorePath, alias, storePassword, keyPassword }
 */
async function getSigningMaterialById(pool, keyId) {
  const row = await getSigningKeyById(pool, keyId);
  if (!row) return null;

  const absKeystore = path.join(CI_ROOT, row.keystore_path);
  if (!fs.existsSync(absKeystore)) {
    throw new Error(`Keystore missing on disk: ${row.keystore_path}`);
  }

  if (row.keystore_sha256) {
    const cur = sha256File(absKeystore);
    if (cur !== row.keystore_sha256) {
      throw new Error("Keystore integrity check failed (sha256 mismatch)");
    }
  }

  return {
    id: row.id,
    mode: row.mode,
    keystorePath: absKeystore,
    alias: row.key_alias,
    storePassword: decrypt(row.store_pass_enc),
    keyPassword: decrypt(row.key_pass_enc),
  };
}

/**
 * DB upsert
 */
async function upsertSigningKey(pool, row) {
  const {
    safe_name,
    package_name,
    mode,
    keystore_path,
    keystore_sha256,
    key_alias,
    store_pass_enc,
    key_pass_enc,
  } = row;

  await pool.query(
    `
    INSERT INTO android_signing_keys
      (safe_name, package_name, mode, keystore_path, keystore_sha256, key_alias, store_pass_enc, key_pass_enc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      package_name=VALUES(package_name),
      mode=VALUES(mode),
      keystore_path=VALUES(keystore_path),
      keystore_sha256=VALUES(keystore_sha256),
      key_alias=VALUES(key_alias),
      store_pass_enc=VALUES(store_pass_enc),
      key_pass_enc=VALUES(key_pass_enc),
      updated_at=NOW()
    `,
    [
      safe_name,
      package_name,
      mode,
      keystore_path,
      keystore_sha256,
      key_alias,
      store_pass_enc,
      key_pass_enc,
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM android_signing_keys WHERE safe_name=? LIMIT 1",
    [safe_name]
  );
  return rows[0];
}

/**
 * ✅ 자동 생성 (managed)
 */
async function generateManagedKey(pool, { safeName, packageName }) {
  const dir = secureKeyDir(safeName);
  ensureDir(dir);

  const keystorePath = path.join(dir, "release.jks");
  const alias = "release";

  // 이미 존재하면 재사용
  if (!fs.existsSync(keystorePath)) {
    const storePass = randPassword(24);
    const keyPass = randPassword(24);

    // keytool 생성
    await run(KEYTOOL_BIN, [
      "-genkeypair",
      "-v",
      "-storetype",
      "JKS",
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
      "-storepass",
      storePass,
      "-keypass",
      keyPass,
      "-dname",
      `CN=${packageName}, OU=Wraply, O=Wraply, L=Seoul, S=Seoul, C=KR`,
    ]);

    const fileSha = sha256File(keystorePath);

    // meta.json (비번 저장 X)
    fs.writeFileSync(
      path.join(dir, "meta.json"),
      JSON.stringify(
        { safeName, packageName, alias, sha256: fileSha, createdAt: new Date().toISOString() },
        null,
        2
      ),
      "utf8"
    );

    // DB 저장(암호화)
    return upsertSigningKey(pool, {
      safe_name: safeName,
      package_name: packageName,
      mode: "managed",
      keystore_path: path.relative(CI_ROOT, keystorePath).replace(/\\/g, "/"), // builds/... 같은 정책처럼 상대 경로
      keystore_sha256: fileSha,
      key_alias: alias,
      store_pass_enc: encrypt(storePass),
      key_pass_enc: encrypt(keyPass),
    });
  }

  // 존재하면 DB가 없을 수 있으니 DB 조회 후 없으면 등록
  const existing = await getSigningKey(pool, safeName);
  if (existing) return existing;

  const fileSha = sha256File(keystorePath);
  // 비밀번호는 복구 불가이므로, 파일만 있고 DB가 없으면 운영상 위험 → 생성 불가 처리 권장
  throw new Error("Keystore exists on disk but not in DB. Refuse for safety.");
}

/**
 * ✅ 업로드 검증 + 저장(uploaded)
 * - uploadedFilePath: 임시 업로드 파일 경로
 */
async function verifyAndSaveUploadedKey(pool, {
  safeName,
  packageName,
  uploadedFilePath,
  alias,
  storePassword,
  keyPassword,
}) {
  // 1) keytool list로 storePass 검증
  await run(KEYTOOL_BIN, [
    "-list",
    "-keystore",
    uploadedFilePath,
    "-storepass",
    storePassword,
  ]);

  // 2) alias 존재 확인 (keyPassword는 실제로 sign에서 필요하니 저장)
  // keytool -list 결과에 alias가 있으면 OK
  const { out } = await run(KEYTOOL_BIN, [
    "-list",
    "-keystore",
    uploadedFilePath,
    "-storepass",
    storePassword,
  ]);

  if (!out.includes(alias)) {
    throw new Error(`Alias not found in keystore: ${alias}`);
  }

  const dir = secureKeyDir(safeName);
  ensureDir(dir);

  const finalPath = path.join(dir, "release.jks");
  fs.copyFileSync(uploadedFilePath, finalPath);

  const fileSha = sha256File(finalPath);

  fs.writeFileSync(
    path.join(dir, "meta.json"),
    JSON.stringify(
      { safeName, packageName, alias, sha256: fileSha, uploadedAt: new Date().toISOString() },
      null,
      2
    ),
    "utf8"
  );

  // DB upsert
  return upsertSigningKey(pool, {
    safe_name: safeName,
    package_name: packageName,
    mode: "uploaded",
    keystore_path: path.relative(CI_ROOT, finalPath).replace(/\\/g, "/"),
    keystore_sha256: fileSha,
    key_alias: alias,
    store_pass_enc: encrypt(storePassword),
    key_pass_enc: encrypt(keyPassword),
  });
}

/**
 * ✅ 빌드 직전에 필요한 평문 정보 반환
 */
async function getSigningMaterial(pool, safeName) {
  const row = await getSigningKey(pool, safeName);
  if (!row) return null;

  const absKeystore = path.join(CI_ROOT, row.keystore_path);
  if (!fs.existsSync(absKeystore)) {
    throw new Error(`Keystore missing on disk: ${row.keystore_path}`);
  }

  // 무결성 체크(선택)
  if (row.keystore_sha256) {
    const cur = sha256File(absKeystore);
    if (cur !== row.keystore_sha256) {
      throw new Error("Keystore integrity check failed (sha256 mismatch)");
    }
  }

  return {
    id: row.id,
    mode: row.mode,
    keystorePath: absKeystore,
    alias: row.key_alias,
    storePassword: decrypt(row.store_pass_enc),
    keyPassword: decrypt(row.key_pass_enc),
  };
}

/**
 * ✅ 빌드 전에 키가 없으면 생성 (managed)
 */
async function ensureSigningKey(pool, { safeName, packageName, mode }) {
  const existing = await getSigningKey(pool, safeName);
  if (existing) return existing;

  if (mode === "managed") {
    return generateManagedKey(pool, { safeName, packageName });
  }

  // uploaded 모드는 업로드가 선행되어야 함
  throw new Error("No signing key found. Upload keystore first or use managed mode.");
}

module.exports = {
  secureUploadDir,
  ensureSigningKey,
  getSigningMaterial,
  getSigningMaterialById, // ✅ 추가
  verifyAndSaveUploadedKey,
};