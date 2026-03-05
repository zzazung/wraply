const express = require("express");
const router = express.Router();

// MVP: 테스트용 로그인 (실서비스는 DB 검증 + JWT 발급)
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  // TODO: 실제 user 검증
  const token = "dummy_token";

  // 쿠키로 줄 거면:
  res.cookie("wraply_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  // 프론트가 token을 직접 쓰는 구조면 json으로도 반환
  return res.json({ token, user: { email } });
});

router.get("/me", async (req, res) => {
  // TODO: Bearer 또는 cookie 검증
  return res.json({ user: { ok: true } });
});

module.exports = router;