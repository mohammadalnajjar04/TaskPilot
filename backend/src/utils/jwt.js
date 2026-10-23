const jwt = require("jsonwebtoken");
const config = require("../config/env");

const generateAccessToken = (user) => {
  const payload = {
    sub: user.user_id,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    algorithm: "HS256",
    expiresIn: config.jwt.expiresIn,
    issuer: "taskpilot-api",
    audience: "taskpilot-client",
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: ["HS256"],
    issuer: "taskpilot-api",
    audience: "taskpilot-client",
  });
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
