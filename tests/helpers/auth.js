const jwt = require("jsonwebtoken");

function createTestToken() {

  const payload = {
    userId: 1,
    email: "test@wraply.com",
    role: "admin"
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

}

module.exports = {
  createTestToken
};