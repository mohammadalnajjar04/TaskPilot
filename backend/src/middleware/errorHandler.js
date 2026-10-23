const config = require("../config/env");

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let code = error.code || "INTERNAL_ERROR";

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    statusCode = 400;
    message = "Invalid JSON body";
    code = "INVALID_JSON";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
    code = "TOKEN_EXPIRED";
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    code = "INVALID_TOKEN";
  }

  if (error.code === "23505") {
    statusCode = 409;
    message = "A record with the same unique value already exists";
    code = "DUPLICATE_VALUE";
  }

  if (error.code === "23503") {
    statusCode = 400;
    message = "The referenced record does not exist";
    code = "FOREIGN_KEY_VIOLATION";
  }

  if (error.code === "23514") {
    statusCode = 400;
    message = "The supplied data violates a database rule";
    code = "CHECK_CONSTRAINT_VIOLATION";
  }

  if (error.code === "22P02") {
    statusCode = 400;
    message = "Invalid data format";
    code = "INVALID_DATA_FORMAT";
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  const response = {
    success: false,
    error: {
      code,
      message:
        statusCode >= 500 && config.nodeEnv === "production"
          ? "Internal server error"
          : message,
    },
  };

  if (config.nodeEnv !== "production" && error.stack) {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  errorHandler,
};
