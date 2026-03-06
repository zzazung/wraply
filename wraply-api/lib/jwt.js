const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "wraply_secret";

function signToken(payload) {

  return jwt.sign(payload, SECRET, {
    expiresIn: "7d"
  });

}

function verifyToken(token) {

  try {

    return jwt.verify(token, SECRET);

  } catch (err) {

    return null;

  }

}

module.exports = {
  signToken,
  verifyToken
};