const { body, param } = require("express-validator");

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const categoryIdValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Category id must be a positive integer"),
];

const categoryNameRule = body("category_name")
  .isString()
  .withMessage("Category name must be a string")
  .trim()
  .notEmpty()
  .withMessage("Category name is required")
  .isLength({ min: 2, max: 80 })
  .withMessage("Category name must be between 2 and 80 characters");

const colorRule = body("color")
  .optional({ values: "null" })
  .isString()
  .withMessage("Color must be a string")
  .trim()
  .matches(HEX_COLOR_PATTERN)
  .withMessage("Color must be a valid 6-digit HEX color, e.g. #2563EB");

const createCategoryValidator = [categoryNameRule, colorRule];

const updateCategoryValidator = [categoryNameRule, colorRule];

module.exports = {
  categoryIdValidator,
  createCategoryValidator,
  updateCategoryValidator,
};
