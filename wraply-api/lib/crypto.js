// lib/crypto.js
const crypto = require("crypto");

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const WRAPLY_SECRET_KEY = process.env.WRAPLY_SECRET_KEY;

function getKey() {
  const raw = WRAPLY_SECRET_KEY || "";
  if (raw.length < 16) {
    throw new Error("WRAPLY_SECRET_KEY too short");
  }
  // 32바이트 키로 정규화
  return crypto.createHash("sha256").update(raw).digest();
}

function encrypt(plain) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(b64) {
  const key = getKey();
  const buf = Buffer.from(String(b64), "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
  return plain.toString("utf8");
}

module.exports = { encrypt, decrypt };