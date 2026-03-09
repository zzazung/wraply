const express = require("express");

const router = express.Router();

const { query } =
  require("@wraply/shared/db");

const { signToken } =
  require("../lib/jwt");

const {
  hashPassword,
  verifyPassword
} = require("../lib/crypto");


/**
 * 회원가입
 */
router.post("/register", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body || {};

    if (!email || !password) {

      return res.status(400).json({
        error: "email and password required"
      });

    }

    if (password.length < 6) {

      return res.status(400).json({
        error: "password too short"
      });

    }

    const hash =
      await hashPassword(password);

    const result =
      await query(
        `
        INSERT INTO users
        (email, password_hash)
        VALUES (?, ?)
        `,
        [email, hash]
      );

    res.json({
      id: result.insertId
    });

  } catch (err) {

    if (
      err.code ===
      "ER_DUP_ENTRY"
    ) {

      return res.status(400).json({
        error: "email already exists"
      });

    }

    console.error(
      "register error:",
      err
    );

    res.status(500).json({
      error: "register failed"
    });

  }

});


/**
 * 로그인
 */
router.post("/login", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body || {};

    if (!email || !password) {

      return res.status(400).json({
        error: "email and password required"
      });

    }

    const rows =
      await query(
        `
        SELECT *
        FROM users
        WHERE email = ?
        `,
        [email]
      );

    const user = rows[0];

    if (!user) {

      return res.status(401).json({
        error: "invalid credentials"
      });

    }

    const valid =
      await verifyPassword(
        password,
        user.password_hash
      );

    if (!valid) {

      return res.status(401).json({
        error: "invalid credentials"
      });

    }

    const token =
      signToken({
        userId: user.id,
        email: user.email,
        role: "user"
      });

    res.json({
      token
    });

  } catch (err) {

    console.error(
      "login error:",
      err
    );

    res.status(500).json({
      error: "login failed"
    });

  }

});

module.exports = router;