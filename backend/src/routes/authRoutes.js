const express = require("express");
const rateLimit = require("express-rate-limit");

const config = require("../config/env");
const authController = require("../controllers/authController");
const authValidator = require("../validators/authValidator");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

const registerLimit =
  config.nodeEnv === "test" ? 10000 : 5;
const loginLimit =
  config.nodeEnv === "test" ? 10000 : 10;

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    },
  });
};

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: registerLimit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: loginLimit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

router.post(
  "/register",
  registerLimiter,
  authValidator.registerValidator,
  validateRequest,
  authController.register
);

router.post(
  "/login",
  loginLimiter,
  authValidator.loginValidator,
  validateRequest,
  authController.login
);

router.get("/me", authenticate, authController.getMe);

module.exports = router;
