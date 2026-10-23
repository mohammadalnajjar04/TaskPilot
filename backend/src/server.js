const http = require("http");

const app = require("./app");
const config = require("./config/env");
const {
  testDatabaseConnection,
  closeDatabaseConnection,
} = require("./config/db");
const { createDefaultAdmin } = require("./bootstrap/createDefaultAdmin");

let server;
let isShuttingDown = false;

const startServer = async () => {
  const databaseInfo = await testDatabaseConnection();

  console.log(
    `PostgreSQL connected: ${databaseInfo.databaseName} as ${databaseInfo.databaseUser}`
  );

  await createDefaultAdmin();

  server = http.createServer(app);

  server.listen(config.port, () => {
    console.log(
      `TaskPilot API running on http://localhost:${config.port}`
    );
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${config.port} is already in use`);
    } else {
      console.error("HTTP server error:", error.message);
    }

    process.exit(1);
  });
};

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully...`);

  const forceShutdownTimer = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);

  forceShutdownTimer.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    await closeDatabaseConnection();
    console.log("Server and database connections closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  shutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("UNCAUGHT_EXCEPTION");
});

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
