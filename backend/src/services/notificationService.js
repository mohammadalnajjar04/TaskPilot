const notificationRepository = require("../repositories/notificationRepository");
const userRepository = require("../repositories/userRepository");
const taskRepository = require("../repositories/taskRepository");
const projectRepository = require("../repositories/projectRepository");
const { AppError } = require("../utils/errors");

const NOTIFICATION_NOT_FOUND_CODE = "NOTIFICATION_NOT_FOUND";
const INVALID_DATA_CODE = "INVALID_NOTIFICATION_DATA";

const ALLOWED_NOTIFICATION_TYPES = new Set([
  "task_assigned",
  "deadline_approaching",
  "task_overdue",
  "comment_added",
  "project_updated",
  "project_completed",
]);

const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

const normalizePositiveInteger = (value) =>
  isPositiveInteger(value) ? value : null;

const getOwnedNotificationOrThrow = async (notificationId, actor) => {
  if (!isPositiveInteger(notificationId)) {
    throw new AppError(
      "Notification not found",
      404,
      NOTIFICATION_NOT_FOUND_CODE
    );
  }

  const notification = await notificationRepository.findById(notificationId);

  if (
    !notification ||
    Number(notification.user_id) !== Number(actor.user_id)
  ) {
    throw new AppError(
      "Notification not found",
      404,
      NOTIFICATION_NOT_FOUND_CODE
    );
  }

  return notification;
};

const normalizeFilters = (filters) => {
  const source = filters || {};
  const normalized = {};

  if (source.is_read !== undefined && source.is_read !== null) {
    const raw =
      typeof source.is_read === "string"
        ? source.is_read.toLowerCase()
        : source.is_read;

    if (raw === true || raw === "true" || raw === "1") {
      normalized.is_read = true;
    } else if (raw === false || raw === "false" || raw === "0") {
      normalized.is_read = false;
    }
  }

  if (source.notification_type !== undefined && source.notification_type !== null) {
    if (!ALLOWED_NOTIFICATION_TYPES.has(source.notification_type)) {
      throw new AppError(
        "Invalid notification type",
        422,
        "INVALID_NOTIFICATION_TYPE"
      );
    }

    normalized.notification_type = source.notification_type;
  }

  const projectId = normalizePositiveInteger(source.project_id);
  if (projectId !== null) {
    normalized.project_id = projectId;
  }

  const taskId = normalizePositiveInteger(source.task_id);
  if (taskId !== null) {
    normalized.task_id = taskId;
  }

  return normalized;
};

const listNotifications = async (actor, filters) => {
  const normalizedFilters = normalizeFilters(filters);

  return notificationRepository.findByUser(
    actor.user_id,
    normalizedFilters
  );
};

const getNotification = async (notificationId, actor) =>
  getOwnedNotificationOrThrow(notificationId, actor);

const markNotificationAsRead = async (notificationId, actor) => {
  if (!isPositiveInteger(notificationId)) {
    throw new AppError(
      "Notification not found",
      404,
      NOTIFICATION_NOT_FOUND_CODE
    );
  }

  const notification = await notificationRepository.markAsRead(
    notificationId,
    actor.user_id
  );

  if (!notification) {
    throw new AppError(
      "Notification not found",
      404,
      NOTIFICATION_NOT_FOUND_CODE
    );
  }

  return notification;
};

const markAllNotificationsAsRead = async (actor) => {
  const count = await notificationRepository.markAllAsRead(actor.user_id);

  return { count };
};

const deleteNotification = async (notificationId, actor) => {
  if (!isPositiveInteger(notificationId)) {
    throw new AppError(
      "Notification not found",
      404,
      NOTIFICATION_NOT_FOUND_CODE
    );
  }

  const deleted = await notificationRepository.delete(
    notificationId,
    actor.user_id
  );

  if (!deleted) {
    throw new AppError(
      "Notification not found",
      404,
      NOTIFICATION_NOT_FOUND_CODE
    );
  }

  return { notification_id: Number(notificationId) };
};

const getUnreadCount = async (actor) => {
  const count = await notificationRepository.countUnread(actor.user_id);

  return { count };
};

const createNotification = async (data) => {
  const source = data || {};

  const userId = source.userId;
  if (!isPositiveInteger(userId)) {
    throw new AppError(
      "Invalid notification data",
      422,
      INVALID_DATA_CODE
    );
  }

  if (!ALLOWED_NOTIFICATION_TYPES.has(source.notificationType)) {
    throw new AppError(
      "Invalid notification type",
      422,
      "INVALID_NOTIFICATION_TYPE"
    );
  }

  const title =
    typeof source.title === "string" ? source.title.trim() : "";
  const message =
    typeof source.message === "string" ? source.message.trim() : "";

  if (!title || title.length > 150) {
    throw new AppError(
      "Invalid notification data",
      422,
      INVALID_DATA_CODE
    );
  }

  if (!message) {
    throw new AppError(
      "Invalid notification data",
      422,
      INVALID_DATA_CODE
    );
  }

  const taskId = normalizePositiveInteger(source.taskId);
  const projectId = normalizePositiveInteger(source.projectId);

  if (source.taskId !== undefined && source.taskId !== null && taskId === null) {
    throw new AppError(
      "Invalid notification data",
      422,
      INVALID_DATA_CODE
    );
  }

  if (
    source.projectId !== undefined &&
    source.projectId !== null &&
    projectId === null
  ) {
    throw new AppError(
      "Invalid notification data",
      422,
      INVALID_DATA_CODE
    );
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (!user.is_active) {
    throw new AppError("User is not active", 403, "USER_NOT_ACTIVE");
  }

  let task = null;
  if (taskId !== null) {
    task = await taskRepository.findById(taskId);

    if (!task) {
      throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
    }
  }

  if (projectId !== null) {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND");
    }
  }

  if (taskId !== null && projectId !== null) {
    if (Number(task.project_id) !== Number(projectId)) {
      throw new AppError(
        "Task does not belong to the provided project",
        422,
        "TASK_PROJECT_MISMATCH"
      );
    }
  }

  return notificationRepository.create({
    userId,
    taskId,
    projectId,
    notificationType: source.notificationType,
    title,
    message,
  });
};

module.exports = {
  listNotifications,
  getNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
};
