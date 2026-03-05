const { verifyToken } = require("../lib/jwt")

function requireAuth(req, res, next) {

  const header = req.headers.authorization

  if (!header) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const token = header.replace("Bearer ", "")

  try {

    const user = verifyToken(token)

    req.user = user

    next()

  } catch (err) {

    return res.status(401).json({ error: "Invalid token" })

  }

}

module.exports = {
  requireAuth
}