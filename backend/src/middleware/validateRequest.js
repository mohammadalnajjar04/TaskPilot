const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: result.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      },
    });
  }

  next();
};

module.exports = validateRequest;
