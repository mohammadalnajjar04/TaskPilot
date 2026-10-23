const categoryRepository = require("../repositories/categoryRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const {
  AppError,
  ForbiddenError,
  ConflictError,
} = require("../utils/errors");

const NOT_FOUND_CODE = "CATEGORY_NOT_FOUND";

const isAdmin = (user) => user.role === "admin";

const canAccess = (category, user) =>
  isAdmin(user) || category.user_id === user.user_id;

const getCategory = async ({ user, categoryId }) => {
  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404, NOT_FOUND_CODE);
  }

  if (!canAccess(category, user)) {
    throw new ForbiddenError(
      "You do not have permission to access this category"
    );
  }

  return category;
};

const getCategories = async ({ user }) => {
  if (isAdmin(user)) {
    return categoryRepository.findAll();
  }

  return categoryRepository.findByUser(user.user_id);
};

const createCategory = async ({ user, category_name, color }) => {
  const categoryName = category_name.trim();

  const duplicate = await categoryRepository.findByUserAndName(
    user.user_id,
    categoryName
  );

  if (duplicate) {
    throw new ConflictError(
      "A category with this name already exists",
      "CATEGORY_ALREADY_EXISTS"
    );
  }

  const category = await categoryRepository.create({
    user_id: user.user_id,
    category_name: categoryName,
    color,
  });

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "CATEGORY_CREATED",
    description: `Category created: ${category.category_name}`,
  });

  return category;
};

const updateCategory = async ({ user, categoryId, body }) => {
  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404, NOT_FOUND_CODE);
  }

  if (!canAccess(category, user)) {
    throw new ForbiddenError(
      "You do not have permission to update this category"
    );
  }

  const fields = {};

  fields.category_name = body.category_name.trim();

  if (body.color !== undefined && body.color !== null) {
    fields.color = body.color;
  }

  const duplicate = await categoryRepository.findByUserAndName(
    user.user_id,
    fields.category_name
  );

  if (duplicate && Number(duplicate.category_id) !== Number(categoryId)) {
    throw new ConflictError(
      "A category with this name already exists",
      "CATEGORY_ALREADY_EXISTS"
    );
  }

  const updated = await categoryRepository.update(categoryId, fields);

  if (!updated) {
    throw new AppError("Category not found", 404, NOT_FOUND_CODE);
  }

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "CATEGORY_UPDATED",
    description: `Category updated: ${updated.category_name}`,
  });

  return updated;
};

const deleteCategory = async ({ user, categoryId }) => {
  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404, NOT_FOUND_CODE);
  }

  if (!canAccess(category, user)) {
    throw new ForbiddenError(
      "You do not have permission to delete this category"
    );
  }

  const deleted = await categoryRepository.remove(categoryId);

  if (!deleted) {
    throw new AppError("Category not found", 404, NOT_FOUND_CODE);
  }

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "CATEGORY_DELETED",
    description: `Category deleted: ${category.category_name}`,
  });

  return { category_id: Number(categoryId) };
};

module.exports = {
  getCategory,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
