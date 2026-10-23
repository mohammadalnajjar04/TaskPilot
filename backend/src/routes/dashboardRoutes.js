const express = require("express");

const dashboardController = require("../controllers/dashboardController");
const dashboardValidator = require("../validators/dashboardValidator");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get("/overview", dashboardController.getOverview);
router.get("/projects-progress", dashboardController.getProjectsProgress);
router.get(
  "/upcoming-tasks",
  dashboardValidator.upcomingTasksValidator,
  validateRequest,
  dashboardController.getUpcomingTasks
);

module.exports = router;
