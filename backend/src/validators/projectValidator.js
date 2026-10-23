const { body, param } = require("express-validator");
const { ALLOWED_STATUSES } = require("../utils/projectStatus");

const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

const projectIdValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Project id must be a positive integer"),
];

const projectKeyRule = body("project_key")
  .isString()
  .withMessage("Project key must be a string")
  .trim()
  .notEmpty()
  .withMessage("Project key is required")
  .isLength({ min: 2, max: 10 })
  .withMessage("Project key must be between 2 and 10 characters")
  .matches(PROJECT_KEY_PATTERN)
  .withMessage(
    "Project key must start with a letter and contain only uppercase letters and digits"
  );

const updateProjectKeyRule = body("project_key")
  .optional()
  .isString()
  .withMessage("Project key must be a string")
  .trim()
  .notEmpty()
  .withMessage("Project key cannot be empty")
  .isLength({ min: 2, max: 10 })
  .withMessage("Project key must be between 2 and 10 characters")
  .matches(PROJECT_KEY_PATTERN)
  .withMessage(
    "Project key must start with a letter and contain only uppercase letters and digits"
  );

const projectNameRule = body("project_name")
  .isString()
  .withMessage("Project name must be a string")
  .trim()
  .notEmpty()
  .withMessage("Project name is required")
  .isLength({ min: 3, max: 150 })
  .withMessage("Project name must be between 3 and 150 characters");

const descriptionRule = body("description")
  .optional()
  .isString()
  .withMessage("Description must be a string")
  .trim()
  .isLength({ max: 2000 })
  .withMessage("Description must not exceed 2000 characters");

const statusRule = body("status")
  .optional()
  .isString()
  .withMessage("Status must be a string")
  .isIn(ALLOWED_STATUSES)
  .withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(", ")}`);

const startDateRule = body("start_date")
  .optional({ values: "null" })
  .isISO8601()
  .withMessage("Start date must be a valid date");

const endDateRule = body("end_date")
  .optional({ values: "null" })
  .isISO8601()
  .withMessage("End date must be a valid date");

const progressPercentageRule = body("progress_percentage")
  .optional()
  .isInt({ min: 0, max: 100 })
  .withMessage("Progress percentage must be an integer between 0 and 100");

const createProjectValidator = [
  projectKeyRule,
  projectNameRule,
  descriptionRule,
  statusRule,
  startDateRule,
  endDateRule,
  progressPercentageRule,
];

const updateProjectValidator = [
  updateProjectKeyRule,
  projectNameRule,
  descriptionRule,
  statusRule,
  startDateRule,
  endDateRule,
  progressPercentageRule,
];

const changeProjectStatusValidator = [
  body("status")
    .isString()
    .withMessage("Status must be a string")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(", ")}`),
];

module.exports = {
  projectIdValidator,
  createProjectValidator,
  updateProjectValidator,
  changeProjectStatusValidator,
};
