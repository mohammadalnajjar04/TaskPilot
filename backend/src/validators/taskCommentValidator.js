const { body, param } = require("express-validator");

const taskIdParam = param("taskId")
  .isInt({ min: 1 })
  .withMessage("Task id must be a positive integer");

const commentIdParam = param("commentId")
  .isInt({ min: 1 })
  .withMessage("Comment id must be a positive integer");

const commentTextRequired = body("comment_text")
  .isString()
  .withMessage("Comment text must be a string")
  .trim()
  .notEmpty()
  .withMessage("Comment text is required");

const listCommentsValidator = [taskIdParam];

const createCommentValidator = [taskIdParam, commentTextRequired];

const updateCommentValidator = [taskIdParam, commentIdParam, commentTextRequired];

const deleteCommentValidator = [taskIdParam, commentIdParam];

module.exports = {
  listCommentsValidator,
  createCommentValidator,
  updateCommentValidator,
  deleteCommentValidator,
};
