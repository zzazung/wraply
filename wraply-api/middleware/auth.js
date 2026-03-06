const { verifyToken } = require("../lib/jwt");

function extractToken(req) {

  const header = req.headers.authorization;

  if (!header) return null;

  const parts = header.split(" ");

  if (parts.length !== 2) return null;

  if (parts[0] !== "Bearer") return null;

  return parts[1];

}

function requireUser(req, res, next) {

  const token = extractToken(req);

  if (!token) {

    return res.status(401).json({
      error: "Unauthorized"
    });

  }

  const payload = verifyToken(token);

  if (!payload) {

    return res.status(401).json({
      error: "Invalid token"
    });

  }

  req.user = payload;

  next();

}

function requireAdmin(req, res, next) {

  const token = extractToken(req);

  if (!token) {

    return res.status(401).json({
      error: "Unauthorized"
    });

  }

  const payload = verifyToken(token);

  if (!payload) {

    return res.status(401).json({
      error: "Invalid token"
    });

  }

  if (payload.role !== "admin") {

    return res.status(403).json({
      error: "Forbidden"
    });

  }

  req.user = payload;

  next();

}

function requireWorker(req, res, next) {

  const token = req.headers["x-worker-token"];

  if (!token) {

    return res.status(401).json({
      error: "Worker auth required"
    });

  }

  if (token !== process.env.WORKER_TOKEN) {

    return res.status(403).json({
      error: "Invalid worker token"
    });

  }

  next();

}

module.exports = {
  requireUser,
  requireAdmin,
  requireWorker
};