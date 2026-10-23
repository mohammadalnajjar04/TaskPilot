const { body, param, query } = require("express-validator");
const {
  ALLOWED_STATUSES,
  ALLOWED_URGENCY_PRIORITIES,
  ALLOWED_AGILE_IMPORTANCE,
} = require("../utils/taskStatus");

const taskIdValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Task id must be a positive integer"),
];

const titleRule = body("title")
  .isString()
  .withMessage("Title must be a string")
  .trim()
  .notEmpty()
  .withMessage("Title is required")
  .isLength({ min: 3, max: 150 })
  .withMessage("Title must be between 3 and 150 characters");

const updateTitleRule = body("title")
  .optional()
  .isString()
  .withMessage("Title must be a string")
  .trim()
  .notEmpty()
  .withMessage("Title cannot be empty")
  .isLength({ min: 3, max: 150 })
  .withMessage("Title must be between 3 and 150 characters");

const descriptionRule = body("description")
  .optional({ values: "null" })
  .isString()
  .withMessage("Description must be a string")
  .trim()
  .isLength({ max: 2000 })
  .withMessage("Description must not exceed 2000 characters");

const projectIdRule = body("project_id")
  .isInt({ min: 1 })
  .withMessage("Project id must be a positive integer");

const updateProjectIdRule = body("project_id")
  .optional({ values: "null" })
  .isInt({ min: 1 })
  .withMessage("Project id must be a positive integer");

const categoryIdRule = body("category_id")
  .optional({ values: "null" })
  .isInt({ min: 1 })
  .withMessage("Category id must be a positive integer");

const assignedToRule = body("assigned_to")
  .optional({ values: "null" })
  .isInt({ min: 1 })
  .withMessage("assigned_to must be a positive integer");

const parentTaskIdRule = body("parent_task_id")
  .optional({ values: "null" })
  .isInt({ min: 1 })
  .withMessage("parent_task_id must be a positive integer");

const statusRule = body("status")
  .optional()
  .isString()
  .withMessage("Status must be a string")
  .isIn(ALLOWED_STATUSES)
  .withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(", ")}`);

const urgencyPriorityRule = body("urgency_priority")
  .optional()
  .isString()
  .withMessage("urgency_priority must be a string")
  .isIn(ALLOWED_URGENCY_PRIORITIES)
  .withMessage(
    `urgency_priority must be one of: ${ALLOWED_URGENCY_PRIORITIES.join(", ")}`
  );

const agileImportanceRule = body("agile_importance")
  .optional()
  .isString()
  .withMessage("agile_importance must be a string")
  .isIn(ALLOWED_AGILE_IMPORTANCE)
  .withMessage(
    `agile_importance must be one of: ${ALLOWED_AGILE_IMPORTANCE.join(", ")}`
  );

const startDateRule = body("start_date")
  .optional({ values: "null" })
  .isISO8601()
  .withMessage("Start date must be a valid date");

const dueDateRule = body("due_date")
  .optional({ values: "null" })
  .isISO8601()
  .withMessage("Due date must be a valid date")
  .custom((value, { req }) => {
    const startDate = req.body.start_date;
    if (value && startDate && new Date(value) < new Date(startDate)) {
      throw new Error("Due date must be on or after the start date");
    }
    return true;
  });

const estimatedMinutesRule = body("estimated_minutes")
  .optional({ values: "null" })
  .isInt({ min: 1 })
  .withMessage("estimated_minutes must be a positive integer");

const actualMinutesRule = body("actual_minutes")
  .optional({ values: "null" })
  .isInt({ min: 0 })
  .withMessage("actual_minutes must be a non-negative integer");

const progressRule = body("progress_percentage")
  .optional({ values: "null" })
  .isInt({ min: 0, max: 100 })
  .withMessage("progress_percentage must be an integer between 0 and 100");

const createTaskValidator = [
  titleRule,
  projectIdRule,
  descriptionRule,
  assignedToRule,
  categoryIdRule,
  parentTaskIdRule,
  statusRule,
  urgencyPriorityRule,
  agileImportanceRule,
  startDateRule,
  dueDateRule,
  estimatedMinutesRule,
  actualMinutesRule,
  progressRule,
];

const updateTaskValidator = [
  updateTitleRule,
  updateProjectIdRule,
  descriptionRule,
  assignedToRule,
  categoryIdRule,
  parentTaskIdRule,
  statusRule,
  urgencyPriorityRule,
  agileImportanceRule,
  startDateRule,
  dueDateRule,
  estimatedMinutesRule,
  actualMinutesRule,
  progressRule,
];

const changeTaskStatusValidator = [
  body("status")
    .isString()
    .withMessage("Status must be a string")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(", ")}`),
];

const listTasksValidator = [
  query("status")
    .optional()
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Status filter must be one of: ${ALLOWED_STATUSES.join(", ")}`),
  query("urgency_priority")
    .optional()
    .isIn(ALLOWED_URGENCY_PRIORITIES)
    .withMessage(
      `urgency_priority filter must be one of: ${ALLOWED_URGENCY_PRIORITIES.join(", ")}`
    ),
  query("agile_importance")
    .optional()
    .isIn(ALLOWED_AGILE_IMPORTANCE)
    .withMessage(
      `agile_importance filter must be one of: ${ALLOWED_AGILE_IMPORTANCE.join(", ")}`
    ),
  query("project_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Project id filter must be a positive integer"),
  query("category_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category id filter must be a positive integer"),
  query("assigned_to")
    .optional()
    .isInt({ min: 1 })
    .withMessage("assigned_to filter must be a positive integer"),
  query("created_by")
    .optional()
    .isInt({ min: 1 })
    .withMessage("created_by filter must be a positive integer"),
];

module.exports = {
  taskIdValidator,
  createTaskValidator,
  updateTaskValidator,
  changeTaskStatusValidator,
  listTasksValidator,
};
