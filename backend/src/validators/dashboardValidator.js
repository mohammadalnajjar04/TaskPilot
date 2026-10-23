const { query } = require("express-validator");

const upcomingTasksValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit must be an integer between 1 and 50"),
];

module.exports = {
  upcomingTasksValidator,
};
