const taskService = require("../services/taskService");
const asyncHandler = require("../utils/asyncHandler");

const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasks({
    user: req.user,
    filters: req.query,
  });

  res.status(200).json({
    success: true,
    data: { tasks },
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask({
    user: req.user,
    taskId: req.params.id,
  });

  res.status(200).json({
    success: true,
    data: { task },
  });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    user: req.user,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: { task },
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    user: req.user,
    taskId: req.params.id,
    body: req.body,
  });

  res.status(200).json({
    success: true,
    data: { task },
  });
});

const changeTaskStatus = asyncHandler(async (req, res) => {
  const task = await taskService.changeTaskStatus({
    user: req.user,
    taskId: req.params.id,
    status: req.body.status,
  });

  res.status(200).json({
    success: true,
    data: { task },
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask({
    user: req.user,
    taskId: req.params.id,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  changeTaskStatus,
  deleteTask,
};
