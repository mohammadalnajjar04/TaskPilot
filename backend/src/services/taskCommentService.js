const taskRepository = require("../repositories/taskRepository");
const projectRepository = require("../repositories/projectRepository");
const taskCommentRepository = require("../repositories/taskCommentRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const { AppError, ForbiddenError } = require("../utils/errors");

const TASK_NOT_FOUND_CODE = "TASK_NOT_FOUND";
const COMMENT_NOT_FOUND_CODE = "COMMENT_NOT_FOUND";

const isAdmin = (user) => user.role === "admin";

const getTaskOrThrow = async (taskId) => {
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404, TASK_NOT_FOUND_CODE);
  }

  return task;
};

const getCommentOrThrow = async (taskId, commentId) => {
  const comment = await taskCommentRepository.findById(commentId);

  if (!comment || Number(comment.task_id) !== Number(taskId)) {
    throw new AppError("Comment not found", 404, COMMENT_NOT_FOUND_CODE);
  }

  return comment;
};

const computeTaskRoles = async (user, task) => {
  const roles = {
    admin: isAdmin(user),
    owner: false,
    member: false,
    creator: false,
    assignee: false,
  };

  if (roles.admin) {
    return roles;
  }

  roles.creator = Number(task.created_by) === Number(user.user_id);
  roles.assignee =
    task.assigned_to !== null &&
    Number(task.assigned_to) === Number(user.user_id);

  const project = await projectRepository.findById(task.project_id);

  if (project) {
    roles.owner = Number(project.owner_id) === Number(user.user_id);
    roles.member =
      roles.owner ||
      (await projectRepository.isMember(task.project_id, user.user_id));
  }

  return roles;
};

const assertCanViewTask = async (user, task) => {
  const roles = await computeTaskRoles(user, task);

  if (
    !(
      roles.admin ||
      roles.owner ||
      roles.member ||
      roles.creator ||
      roles.assignee
    )
  ) {
    throw new ForbiddenError(
      "You do not have permission to access this task"
    );
  }

  return roles;
};

const normalizeCommentText = (commentText) => {
  const trimmed = typeof commentText === "string" ? commentText.trim() : "";

  if (!trimmed) {
    throw new AppError("Comment text is required", 422, "VALIDATION_ERROR");
  }

  return trimmed;
};

const listComments = async ({ user, taskId }) => {
  const task = await getTaskOrThrow(taskId);

  await assertCanViewTask(user, task);

  return taskCommentRepository.findByTaskId(taskId);
};

const createComment = async ({ user, taskId, commentText }) => {
  const task = await getTaskOrThrow(taskId);

  await assertCanViewTask(user, task);

  const comment = await taskCommentRepository.create({
    taskId,
    userId: user.user_id,
    commentText: normalizeCommentText(commentText),
  });

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "TASK_COMMENT_CREATED",
    description: `Comment created on task "${task.title}"`,
    projectId: task.project_id,
    taskId,
  });

  return comment;
};

const updateComment = async ({ user, taskId, commentId, commentText }) => {
  const task = await getTaskOrThrow(taskId);

  const comment = await getCommentOrThrow(taskId, commentId);

  if (!isAdmin(user) && Number(comment.user_id) !== Number(user.user_id)) {
    throw new ForbiddenError(
      "You do not have permission to update this comment"
    );
  }

  const updated = await taskCommentRepository.update({
    commentId,
    commentText: normalizeCommentText(commentText),
  });

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "TASK_COMMENT_UPDATED",
    description: `Comment updated on task "${task.title}"`,
    projectId: task.project_id,
    taskId,
  });

  return updated;
};

const deleteComment = async ({ user, taskId, commentId }) => {
  const task = await getTaskOrThrow(taskId);

  const comment = await getCommentOrThrow(taskId, commentId);

  const roles = await computeTaskRoles(user, task);

  const isAuthor = Number(comment.user_id) === Number(user.user_id);

  if (!isAdmin(user) && !roles.owner && !isAuthor) {
    throw new ForbiddenError(
      "You do not have permission to delete this comment"
    );
  }

  await taskCommentRepository.delete(commentId);

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "TASK_COMMENT_DELETED",
    description: `Comment deleted on task "${task.title}"`,
    projectId: task.project_id,
    taskId,
  });

  return { task_id: Number(taskId), comment_id: Number(commentId) };
};

module.exports = {
  listComments,
  createComment,
  updateComment,
  deleteComment,
};
