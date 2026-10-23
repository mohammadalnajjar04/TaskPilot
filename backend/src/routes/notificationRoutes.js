const express = require("express");

const notificationController = require("../controllers/notificationController");
const notificationValidator = require("../validators/notificationValidator");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  notificationValidator.listNotificationsValidator,
  validateRequest,
  notificationController.listNotifications
);

router.get("/unread-count", notificationController.getUnreadCount);

router.get(
  "/:notificationId",
  notificationValidator.notificationIdValidator,
  validateRequest,
  notificationController.getNotification
);

router.patch("/read-all", notificationController.markAllNotificationsAsRead);

router.patch(
  "/:notificationId/read",
  notificationValidator.notificationIdValidator,
  validateRequest,
  notificationController.markNotificationAsRead
);

router.delete(
  "/:notificationId",
  notificationValidator.notificationIdValidator,
  validateRequest,
  notificationController.deleteNotification
);

module.exports = router;
