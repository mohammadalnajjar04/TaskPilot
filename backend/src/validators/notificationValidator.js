const { query, param } = require("express-validator");

const ALLOWED_NOTIFICATION_TYPES = [
  "task_assigned",
  "deadline_approaching",
  "task_overdue",
  "comment_added",
  "project_updated",
  "project_completed",
];

const isReadFilter = query("is_read")
  .optional()
  .isIn(["true", "false", "1", "0"])
  .withMessage("is_read must be true, false, 1 or 0");

const notificationTypeFilter = query("notification_type")
  .optional()
  .isIn(ALLOWED_NOTIFICATION_TYPES)
  .withMessage("Invalid notification type");

const projectIdFilter = query("project_id")
  .optional()
  .isInt({ min: 1 })
  .withMessage("project_id must be a positive integer");

const taskIdFilter = query("task_id")
  .optional()
  .isInt({ min: 1 })
  .withMessage("task_id must be a positive integer");

const notificationIdParam = param("notificationId")
  .isInt({ min: 1 })
  .withMessage("Notification id must be a positive integer");

const listNotificationsValidator = [
  isReadFilter,
  notificationTypeFilter,
  projectIdFilter,
  taskIdFilter,
];

const notificationIdValidator = [notificationIdParam];

module.exports = {
  listNotificationsValidator,
  notificationIdValidator,
};
