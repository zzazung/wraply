const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { query } = require("@wraply/shared/db");
const { sign } = require("../lib/jwt");
const { hashPassword, comparePassword } = require("../lib/crypto");

const router = express.Router();

/**
 * Register
 */
router.post("/register", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "email/password required" });

    const rows = await query(
      "SELECT id FROM users WHERE email=? LIMIT 1",
      [email]
    );

    if (rows.length)
      return res.status(400).json({ error: "Email already exists" });

    const userId = uuidv4();
    const tenantId = uuidv4();
    const tenantName = email.split("@")[0];

    const passwordHash = await hashPassword(password);

    // tenant 생성 (owner_user_id 포함)
    await query(
      `
      INSERT INTO tenants
      (id, name, owner_user_id, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      `,
      [tenantId, tenantName, userId]
    );

    // user 생성
    await query(
      `
      INSERT INTO users
      (id, tenant_id, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [userId, tenantId, email, passwordHash]
    );

    const token = sign({ userId, tenantId });

    res.json({
      token,
      userId,
      tenantId
    });

  } catch (err) {

    console.error("register error:", err);

    res.status(500).json({
      error: err.message || "internal error"
    });

  }

});

/**
 * Login
 */
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "email/password required" });

    const rows = await query(
      `
      SELECT id, tenant_id, password_hash
      FROM users
      WHERE email=?
      LIMIT 1
      `,
      [email]
    );

    if (!rows.length)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];

    const ok = await comparePassword(password, user.password_hash);

    if (!ok)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = sign({
      userId: user.id,
      tenantId: user.tenant_id
    });

    res.json({
      token,
      userId: user.id,
      tenantId: user.tenant_id
    });

  } catch (err) {

    console.error("login error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

module.exports = router;
