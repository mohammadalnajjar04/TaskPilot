const taskCommentService = require("../services/taskCommentService");
const asyncHandler = require("../utils/asyncHandler");

const listComments = asyncHandler(async (req, res) => {
  const comments = await taskCommentService.listComments({
    user: req.user,
    taskId: req.params.taskId,
  });

  res.status(200).json({
    success: true,
    data: { comments },
  });
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await taskCommentService.createComment({
    user: req.user,
    taskId: req.params.taskId,
    commentText: req.body.comment_text,
  });

  res.status(201).json({
    success: true,
    data: { comment },
  });
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await taskCommentService.updateComment({
    user: req.user,
    taskId: req.params.taskId,
    commentId: req.params.commentId,
    commentText: req.body.comment_text,
  });

  res.status(200).json({
    success: true,
    data: { comment },
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const result = await taskCommentService.deleteComment({
    user: req.user,
    taskId: req.params.taskId,
    commentId: req.params.commentId,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  listComments,
  createComment,
  updateComment,
  deleteComment,
};
