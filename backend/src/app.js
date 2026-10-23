const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const config = require("./config/env");
const { query } = require("./config/db");
const { NotFoundError } = require("./utils/errors");
const { errorHandler } = require("./middleware/errorHandler");
const { specs, swaggerUiOptions } = require("./config/swagger");
const swaggerUi = require("swagger-ui-express");
const apiRoutes = require("./routes");
const { UPLOAD_DIR } = require("./middleware/uploadTaskAttachment");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (config.nodeEnv === "production") {
  app.use(morgan("combined"));
} else if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskPilot API is running",
    version: "1.0.0",
  });
});

app.get("/api/health", async (req, res, next) => {
  try {
    await query("SELECT 1");

    res.status(200).json({
      success: true,
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

app.get("/api/docs.json", (req, res) => {
  res.status(200).json(specs);
});

app.use("/api/v1", apiRoutes);

app.use(
  "/uploads/task-attachments",
  express.static(UPLOAD_DIR, {
    dotfiles: "deny",
    index: false,
    fallthrough: true,
    maxAge: "1h",
  })
);

app.use((req, res, next) => {
  next(
    new NotFoundError(
      `Route not found: ${req.method} ${req.originalUrl}`
    )
  );
});

app.use(errorHandler);

module.exports = app;
