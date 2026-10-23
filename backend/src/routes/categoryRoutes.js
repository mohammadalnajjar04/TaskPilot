const express = require("express");

const categoryController = require("../controllers/categoryController");
const categoryValidator = require("../validators/categoryValidator");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get("/", categoryController.listCategories);

router.post(
  "/",
  categoryValidator.createCategoryValidator,
  validateRequest,
  categoryController.createCategory
);

router.get(
  "/:id",
  categoryValidator.categoryIdValidator,
  validateRequest,
  categoryController.getCategory
);

router.put(
  "/:id",
  categoryValidator.categoryIdValidator,
  categoryValidator.updateCategoryValidator,
  validateRequest,
  categoryController.updateCategory
);

router.delete(
  "/:id",
  categoryValidator.categoryIdValidator,
  validateRequest,
  categoryController.deleteCategory
);

module.exports = router;
