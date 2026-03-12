const jwt = require("../lib/jwt");
const crypto = require("crypto");

const WRAPLY_DEV = process.env.WRAPLY_DEV === "true";

/**
 * 일반 사용자 인증
 */
function requireAuth(req, res, next) {

  try {

    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({
        error: "missing authorization header"
      });
    }

    const parts = header.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        error: "invalid authorization format"
      });
    }

    const token = parts[1];

    /**
     * DEV USER BYPASS
     */
    if (WRAPLY_DEV && token === "dev-user") {

      req.user = {
        id: "dev-user",
        role: "admin",
        email: "dev@wraply.local"
      };

      return next();
    }

    const payload = jwt.verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    req.user = payload;

    next();

  } catch (err) {

    console.error("auth verify error:", err.message);

    res.status(401).json({
      error: "unauthorized"
    });

  }

}


/**
 * worker 인증
 */
function requireWorker(req, res, next) {

  try {

    const WORKER_TOKEN = process.env.WORKER_TOKEN;

    const token = req.headers["x-worker-token"];

    if (!token) {
      return res.status(401).json({
        error: "missing worker token"
      });
    }

    const tokenBuf = Buffer.from(token);
    const secretBuf = Buffer.from(WORKER_TOKEN);

    if (
      tokenBuf.length !== secretBuf.length ||
      !crypto.timingSafeEqual(tokenBuf, secretBuf)
    ) {
      return res.status(401).json({
        error: "invalid worker token"
      });
    }

    next();

  } catch (err) {

    console.error("worker auth error:", err);

    res.status(401).json({
      error: "unauthorized"
    });

  }

}

module.exports = {
  requireAuth,
  requireWorker
};