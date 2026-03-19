// wraply-api/routes/auth.js

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { pool, query } = require("@wraply/shared/db");
const jwt = require("../lib/jwt");
const { hashPassword, comparePassword } = require("../lib/crypto");

const router = express.Router();

/**
 * 회원가입 (트랜잭션)
 */
router.post("/register", async (req, res) => {

  const conn = await pool.getConnection();

  try {

    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid fields"
      });
    }

    /**
     * 🔥 email 중복 체크 (tenant 없음 → 예외)
     */
    const existing = await query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
      { skipTenantCheck: true }
    );

    if (existing.length) {
      return res.status(400).json({
        error: "Email already exists"
      });
    }

    /**
     * ID 먼저 생성
     */
    const userId = uuidv4();
    const tenantId = uuidv4();

    const tenantName = email.split("@")[0];

    const passwordHash = await hashPassword(password);

    /**
     * 🔥 트랜잭션 시작
     */
    await conn.beginTransaction();

    /**
     * tenant 생성
     */
    await conn.query(
      `
      INSERT INTO tenants (
        id,
        name,
        owner_user_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, NOW(), NOW())
      `,
      [tenantId, tenantName, userId]
    );

    /**
     * user 생성
     */
    await conn.query(
      `
      INSERT INTO users (
        id,
        tenant_id,
        email,
        password_hash,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, NOW(), NOW())
      `,
      [
        userId,
        tenantId,
        email,
        passwordHash
      ]
    );

    /**
     * billing 초기화
     */
    await conn.query(
      `
      INSERT INTO billing (
        tenant_id,
        plan,
        status,
        current_period_end,
        created_at,
        updated_at
      )
      VALUES (?, 'free', 'active', NULL, NOW(), NOW())
      `,
      [tenantId]
    );

    /**
     * 🔥 커밋
     */
    await conn.commit();

    /**
     * JWT 발급
     */
    const token = jwt.signToken({
      userId,
      tenantId
    });

    res.json({
      token,
      userId,
      tenantId
    });

  } catch (err) {

    /**
     * 🔥 롤백
     */
    try {
      await conn.rollback();
    } catch {}

    console.error("register error:", err);

    res.status(500).json({
      error: "internal error"
    });

  } finally {

    conn.release();

  }

});

/**
 * 로그인
 */
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid fields"
      });
    }

    /**
     * 🔥 user 조회 (tenant 모름 → 예외)
     */
    const rows = await query(
      `
      SELECT
        id,
        tenant_id,
        password_hash
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
      { skipTenantCheck: true }
    );

    if (!rows.length) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    const user = rows[0];

    /**
     * 비밀번호 검증
     */
    const valid = await comparePassword(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    /**
     * JWT 발급
     */
    const token = jwt.signToken({
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

    res.status(500).json({
      error: "internal error"
    });

  }

});

module.exports = router;