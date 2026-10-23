const express = require("express");
const authRoutes = require("./authRoutes");
const projectRoutes = require("./projectRoutes");
const projectMemberRoutes = require("./projectMemberRoutes");
const categoryRoutes = require("./categoryRoutes");
const taskRoutes = require("./taskRoutes");
const taskCommentRoutes = require("./taskCommentRoutes");
const taskAttachmentRoutes = require("./taskAttachmentRoutes");
const notificationRoutes = require("./notificationRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskPilot API v1",
  });
});

router.use("/auth", authRoutes);
router.use("/projects/:projectId/members", projectMemberRoutes);
router.use("/projects", projectRoutes);
router.use("/categories", categoryRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/tasks/:taskId/comments", taskCommentRoutes);
router.use("/tasks/:taskId/attachments", taskAttachmentRoutes);
router.use("/tasks", taskRoutes);

module.exports = router;
