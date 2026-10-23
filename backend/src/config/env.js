const path = require("path");
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env"),
});

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
];

const missingVariables = requiredVariables.filter(
  (key) => !process.env[key] || !process.env[key].trim()
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}`
  );
}

const port = Number(process.env.PORT || 5000);
const dbPort = Number(process.env.DB_PORT || 5432);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("PORT must be a valid integer between 1 and 65535");
}

if (!Number.isInteger(dbPort) || dbPort <= 0 || dbPort > 65535) {
  throw new Error("DB_PORT must be a valid integer between 1 and 65535");
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  db: {
    host: process.env.DB_HOST,
    port: dbPort,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    applicationName: "taskpilot-backend",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});

module.exports = config;
