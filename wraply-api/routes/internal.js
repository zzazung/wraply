const express = require("express");
const router = express.Router();
const { broadcastLog, broadcastStatus } = require("../websocket");

require('dotenv').config();

// 간단 내부 인증 (운영형 최소 보호)
function requireInternal(req, res, next) {
  const key = req.header("x-internal-key");
  if (!key || key !== process.env.INTERNAL_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// 로그 이벤트
router.post("/log", requireInternal, (req, res) => {
  const { jobId, line } = req.body || {};
  if (!jobId || !line) {
    return res.status(400).json({ error: "missing fields" });
  }

  broadcastLog(jobId, line);
  res.json({ ok: true });
});

// 상태 이벤트
router.post("/status", requireInternal, (req, res) => {
  const { jobId, status, progress } = req.body || {};
  if (!jobId || !status) {
    return res.status(400).json({ error: "missing fields" });
  }

  broadcastStatus(jobId, { status, progress });
  res.json({ ok: true });
});

module.exports = router;