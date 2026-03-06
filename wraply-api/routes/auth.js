const express = require("express")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

// const pool = require("../db")
const pool = require("@wraply/shared/db")
const { signToken } = require("../lib/jwt")

const router = express.Router()

router.post("/login", async (req, res) => {

  const { email, password } = req.body

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email=?",
    [email]
  )

  const user = rows[0]

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" })
  }

  const ok = await bcrypt.compare(password, user.password_hash)

  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" })
  }

  const token = signToken(user)

  res.json({
    token
  })

})

router.post("/register", async (req, res) => {

  const { email, password } = req.body

  const hash = await bcrypt.hash(password, 10)

  const id = uuidv4()

  await pool.query(
    "INSERT INTO users (id,email,password_hash) VALUES (?,?,?)",
    [id, email, hash]
  )

  const token = signToken({ id, email })

  res.json({
    token
  })

})

module.exports = router