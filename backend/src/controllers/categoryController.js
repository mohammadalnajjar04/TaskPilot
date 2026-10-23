const categoryService = require("../services/categoryService");
const asyncHandler = require("../utils/asyncHandler");

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories({ user: req.user });

  res.status(200).json({
    success: true,
    data: { categories },
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategory({
    user: req.user,
    categoryId: req.params.id,
  });

  res.status(200).json({
    success: true,
    data: { category },
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory({
    user: req.user,
    category_name: req.body.category_name,
    color: req.body.color,
  });

  res.status(201).json({
    success: true,
    data: { category },
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory({
    user: req.user,
    categoryId: req.params.id,
    body: req.body,
  });

  res.status(200).json({
    success: true,
    data: { category },
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory({
    user: req.user,
    categoryId: req.params.id,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
