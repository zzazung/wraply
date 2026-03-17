const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pool = require("@wraply/shared/db");

const {
  secureUploadDir,
  verifyAndSaveUploadedKey,
  ensureSigningKey
} = require("../lib/androidSigning");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }
});

/**
 * 키 상태 조회
 */
router.get("/:safeName", async (req, res) => {

  try {

    const { tenantId } = req.user;
    const safeName = req.params.safeName;

    const [rows] = await pool.query(
      `
      SELECT
        id,
        tenant_id,
        safe_name,
        package_name,
        mode,
        key_alias,
        keystore_sha256,
        created_at,
        updated_at
      FROM android_signing_keys
      WHERE tenant_id=? AND safe_name=?
      `,
      [tenantId, safeName]
    );

    const row = rows[0];

    res.json({
      hasKey: !!row,
      key: row || null
    });

  } catch (e) {

    res.status(500).json({ error: String(e) });

  }

});

/**
 * managed 키 생성 (키 없을 때만)
 */
router.post("/:safeName/generate", async (req, res) => {

  try {

    const { tenantId } = req.user;

    const safeName = req.params.safeName;
    const { packageName } = req.body || {};

    if (!packageName)
      return res.status(400).json({ error: "packageName required" });

    const row = await ensureSigningKey(pool, {
      tenantId,
      safeName,
      packageName,
      mode: "managed"
    });

    res.json({
      success: true,
      id: row.id,
      mode: row.mode
    });

  } catch (e) {

    res.status(500).json({ error: String(e.message || e) });

  }

});

/**
 * uploaded keystore 업로드
 */
router.post("/:safeName/upload", upload.single("file"), async (req, res) => {

  try {

    const { tenantId } = req.user;

    const safeName = req.params.safeName;

    const {
      packageName,
      alias,
      storePassword,
      keyPassword
    } = req.body || {};

    if (!req.file)
      return res.status(400).json({ error: "file required" });

    if (!packageName || !alias || !storePassword || !keyPassword)
      return res.status(400).json({
        error: "packageName/alias/storePassword/keyPassword required"
      });

    const jobId = req.header("x-job-id") || `upload_${Date.now()}`;

    const dir = secureUploadDir(jobId);

    fs.mkdirSync(dir, { recursive: true });

    const tmpPath = path.join(dir, req.file.originalname || "upload.jks");

    fs.writeFileSync(tmpPath, req.file.buffer);

    const row = await verifyAndSaveUploadedKey(pool, {
      tenantId,
      safeName,
      packageName,
      uploadedFilePath: tmpPath,
      alias,
      storePassword,
      keyPassword
    });

    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}

    res.json({
      success: true,
      id: row.id,
      mode: row.mode
    });

  } catch (e) {

    res.status(400).json({ error: String(e.message || e) });

  }

});

module.exports = router;
