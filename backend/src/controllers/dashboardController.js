const dashboardService = require("../services/dashboardService");
const asyncHandler = require("../utils/asyncHandler");

const getOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getDashboardOverview(req.user);

  res.status(200).json({
    success: true,
    data: { overview },
  });
});

const getProjectsProgress = asyncHandler(async (req, res) => {
  const projects = await dashboardService.getProjectsProgress(req.user);

  res.status(200).json({
    success: true,
    data: { projects },
  });
});

const getUpcomingTasks = asyncHandler(async (req, res) => {
  const tasks = await dashboardService.getUpcomingTasks(
    req.user,
    req.query.limit
  );

  res.status(200).json({
    success: true,
    data: { tasks },
  });
});

module.exports = {
  getOverview,
  getProjectsProgress,
  getUpcomingTasks,
};
