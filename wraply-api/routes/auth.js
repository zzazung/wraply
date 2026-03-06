const express = require("express");
const router = express.Router();

const { query } = require("@wraply/shared/db");
const { signToken } = require("../lib/jwt");
const { hashPassword, verifyPassword } = require("../lib/crypto");

/*
회원가입
*/

router.post("/register", async (req, res) => {

  try {

    const { email, password } = req.body;

    const hash = await hashPassword(password);

    const result = await query(`
      INSERT INTO users (email, password_hash)
      VALUES (?, ?)
    `, [email, hash]);

    res.json({
      id: result.insertId
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Register failed"
    });

  }

});

/*
로그인
*/

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const rows = await query(`
      SELECT *
      FROM users
      WHERE email = ?
    `, [email]);

    const user = rows[0];

    if (!user) {

      return res.status(401).json({
        error: "Invalid credentials"
      });

    }

    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {

      return res.status(401).json({
        error: "Invalid credentials"
      });

    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: "user"
    });

    res.json({
      token
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Login failed"
    });

  }

});

module.exports = router;