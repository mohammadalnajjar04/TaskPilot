const { verifyAccessToken } = require("../utils/jwt");
const { findById } = require("../repositories/userRepository");
const {
  UnauthorizedError,
  ForbiddenError,
} = require("../utils/errors");

const authenticate = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return next(
      new UnauthorizedError(
        "Authentication required",
        "AUTHENTICATION_REQUIRED"
      )
    );
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new UnauthorizedError(
        "Invalid authorization header",
        "INVALID_AUTHORIZATION_HEADER"
      )
    );
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(
        new UnauthorizedError("Token has expired", "TOKEN_EXPIRED")
      );
    }

    return next(new UnauthorizedError("Invalid token", "INVALID_TOKEN"));
  }

  const user = await findById(payload.sub);

  if (!user) {
    return next(
      new UnauthorizedError("User no longer exists", "INVALID_TOKEN")
    );
  }

  if (!user.is_active) {
    return next(
      new ForbiddenError("Account is disabled", "ACCOUNT_DISABLED")
    );
  }

  req.user = user;
  next();
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new UnauthorizedError(
          "Authentication required",
          "AUTHENTICATION_REQUIRED"
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          "You do not have permission to perform this action",
          "FORBIDDEN"
        )
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
};
