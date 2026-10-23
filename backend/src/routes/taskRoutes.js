const express = require("express");

const taskController = require("../controllers/taskController");
const taskValidator = require("../validators/taskValidator");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  taskValidator.listTasksValidator,
  validateRequest,
  taskController.listTasks
);

router.post(
  "/",
  taskValidator.createTaskValidator,
  validateRequest,
  taskController.createTask
);

router.get(
  "/:id",
  taskValidator.taskIdValidator,
  validateRequest,
  taskController.getTask
);

router.put(
  "/:id",
  taskValidator.taskIdValidator,
  taskValidator.updateTaskValidator,
  validateRequest,
  taskController.updateTask
);

router.patch(
  "/:id/status",
  taskValidator.taskIdValidator,
  taskValidator.changeTaskStatusValidator,
  validateRequest,
  taskController.changeTaskStatus
);

router.delete(
  "/:id",
  taskValidator.taskIdValidator,
  validateRequest,
  taskController.deleteTask
);

module.exports = router;
