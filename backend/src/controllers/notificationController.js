const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listNotifications(
    req.user,
    req.query
  );

  res.status(200).json({
    success: true,
    data: { notifications },
  });
});

const getNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotification(
    req.params.notificationId,
    req.user
  );

  res.status(200).json({
    success: true,
    data: { notification },
  });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.params.notificationId,
    req.user
  );

  res.status(200).json({
    success: true,
    data: { notification },
  });
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(
    req.user
  );

  res.status(200).json({
    success: true,
    data: { updated_count: result.count },
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(
    req.params.notificationId,
    req.user
  );

  res.status(200).json({
    success: true,
    data: { deleted: result },
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user);

  res.status(200).json({
    success: true,
    data: { unread_count: result.count },
  });
});

module.exports = {
  listNotifications,
  getNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
};
