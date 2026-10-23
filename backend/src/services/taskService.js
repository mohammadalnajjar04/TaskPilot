const taskRepository = require("../repositories/taskRepository");
const projectRepository = require("../repositories/projectRepository");
const categoryRepository = require("../repositories/categoryRepository");
const userRepository = require("../repositories/userRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const {
  DEFAULTS,
  isAllowedStatus,
  isAllowedUrgencyPriority,
  isAllowedAgileImportance,
  isAllowedTransition,
} = require("../utils/taskStatus");
const { AppError, ForbiddenError } = require("../utils/errors");

const NOT_FOUND_CODE = "TASK_NOT_FOUND";

const isAdmin = (user) => user.role === "admin";

const pickUpdateFields = (body) => {
  const fields = {};

  for (const key of [
    "title",
    "description",
    "status",
    "urgency_priority",
    "agile_importance",
    "start_date",
    "due_date",
    "estimated_minutes",
    "actual_minutes",
    "progress_percentage",
    "project_id",
    "category_id",
    "assigned_to",
    "parent_task_id",
  ]) {
    if (body[key] !== undefined) {
      fields[key] = body[key];
    }
  }

  return fields;
};

const taskProjectRoles = async (user, task) => {
  const roles = {
    admin: isAdmin(user),
    owner: false,
    member: false,
    creator: false,
    assignee: false,
  };

  if (roles.admin) {
    return roles;
  }

  roles.creator = Number(task.created_by) === Number(user.user_id);
  roles.assignee =
    task.assigned_to !== null &&
    Number(task.assigned_to) === Number(user.user_id);

  const project = await projectRepository.findById(task.project_id);

  if (project) {
    roles.owner = Number(project.owner_id) === Number(user.user_id);
    roles.member =
      roles.owner || (await projectRepository.isMember(task.project_id, user.user_id));
  }

  return roles;
};

const canView = (roles) =>
  roles.admin || roles.owner || roles.member || roles.creator || roles.assignee;

const canModify = (roles) =>
  roles.admin || roles.owner || roles.creator || roles.assignee;

const canDelete = (roles) => roles.admin || roles.owner || roles.creator;

const resolveProjectForMutation = async ({ user, projectId }) => {
  if (projectId === null || projectId === undefined) {
    return null;
  }

  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError(
      "Referenced project does not exist",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  const accessible =
    isAdmin(user) ||
    Number(project.owner_id) === Number(user.user_id) ||
    (await projectRepository.isMember(projectId, user.user_id));

  if (!accessible) {
    throw new ForbiddenError(
      "You do not have permission to use this project"
    );
  }

  return projectId;
};

const resolveCategoryReference = async ({ user, categoryId }) => {
  if (categoryId === null || categoryId === undefined) {
    return null;
  }

  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw new AppError(
      "Referenced category does not exist",
      404,
      "CATEGORY_NOT_FOUND"
    );
  }

  if (!isAdmin(user) && Number(category.user_id) !== Number(user.user_id)) {
    throw new ForbiddenError(
      "You do not have permission to use this category"
    );
  }

  return categoryId;
};

const resolveAssignee = async ({ projectId, assigneeId }) => {
  if (assigneeId === null || assigneeId === undefined) {
    return null;
  }

  const assignee = await userRepository.findById(assigneeId);

  if (!assignee) {
    throw new AppError("Assigned user does not exist", 404, "ASSIGNEE_NOT_FOUND");
  }

  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError(
      "Referenced project does not exist",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  const isProjectOwner = Number(project.owner_id) === Number(assigneeId);
  const isMember = await projectRepository.isMember(projectId, assigneeId);

  if (!isProjectOwner && !isMember) {
    throw new AppError(
      "Assigned user must belong to the project",
      422,
      "ASSIGNEE_NOT_IN_PROJECT"
    );
  }

  return assigneeId;
};

const resolveParentReference = async ({ projectId, taskId, parentTaskId }) => {
  if (parentTaskId === null || parentTaskId === undefined) {
    return null;
  }

  if (Number(parentTaskId) === Number(taskId)) {
    throw new AppError(
      "A task cannot be its own parent",
      422,
      "CIRCULAR_PARENT_TASK"
    );
  }

  const parent = await taskRepository.findById(parentTaskId);

  if (!parent) {
    throw new AppError("Parent task does not exist", 404, "PARENT_TASK_NOT_FOUND");
  }

  if (Number(parent.project_id) !== Number(projectId)) {
    throw new AppError(
      "Parent task must belong to the same project",
      422,
      "PARENT_TASK_NOT_IN_PROJECT"
    );
  }

  const ancestors = await taskRepository.findAncestorIds(parentTaskId);

  if (ancestors.some((row) => Number(row.task_id) === Number(taskId))) {
    throw new AppError(
      "Setting this parent would create a cycle",
      422,
      "CIRCULAR_PARENT_TASK"
    );
  }

  return parentTaskId;
};

const assertValidDates = ({ startDate, dueDate }) => {
  if (
    startDate &&
    dueDate &&
    new Date(dueDate) < new Date(startDate)
  ) {
    throw new AppError(
      "due_date must be on or after start_date",
      422,
      "INVALID_DATES"
    );
  }
};

const assertValidEnums = ({ status, urgencyPriority, agileImportance }) => {
  if (status !== undefined && !isAllowedStatus(status)) {
    throw new AppError("Invalid task status", 422, "INVALID_STATUS");
  }

  if (
    urgencyPriority !== undefined &&
    !isAllowedUrgencyPriority(urgencyPriority)
  ) {
    throw new AppError("Invalid urgency priority", 422, "INVALID_URGENCY_PRIORITY");
  }

  if (
    agileImportance !== undefined &&
    !isAllowedAgileImportance(agileImportance)
  ) {
    throw new AppError("Invalid agile importance", 422, "INVALID_AGILE_IMPORTANCE");
  }
};

const applyCompletionRules = (task, fields) => {
  const currentStatus = task.status;
  const nextStatus = fields.status !== undefined ? fields.status : currentStatus;
  const progressProvided = fields.progress_percentage !== undefined;

  if (fields.status !== undefined && fields.status !== currentStatus) {
    if (!isAllowedTransition(currentStatus, fields.status)) {
      throw new AppError(
        `Cannot change task status from "${currentStatus}" to "${fields.status}"`,
        422,
        "INVALID_STATUS_TRANSITION"
      );
    }
  }

  if (nextStatus === "done") {
    if (progressProvided && Number(fields.progress_percentage) !== 100) {
      throw new AppError(
        'progress_percentage must be 100 when status is "done"',
        422,
        "INVALID_PROGRESS"
      );
    }

    fields.progress_percentage = 100;
    fields.completed_at = task.completed_at || new Date();
    return;
  }

  fields.completed_at = null;

  if (progressProvided && Number(fields.progress_percentage) >= 100) {
    throw new AppError(
      'progress_percentage must be less than 100 when status is not "done"',
      422,
      "INVALID_PROGRESS"
    );
  }

  if (!progressProvided && Number(task.progress_percentage) >= 100) {
    fields.progress_percentage = 0;
  }
};

const getTask = async ({ user, taskId }) => {
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404, NOT_FOUND_CODE);
  }

  const roles = await taskProjectRoles(user, task);

  if (!canView(roles)) {
    throw new ForbiddenError(
      "You do not have permission to access this task"
    );
  }

  return task;
};

const getTasks = async ({ user, filters = {} }) => {
  if (isAdmin(user)) {
    return taskRepository.findAll(filters);
  }

  return taskRepository.findAccessibleTasks({
    userId: user.user_id,
    isAdmin: false,
    filters,
  });
};

const createTask = async ({
  user,
  project_id,
  category_id,
  assigned_to,
  parent_task_id,
  title,
  description,
  status,
  urgency_priority,
  agile_importance,
  start_date,
  due_date,
  estimated_minutes,
  actual_minutes,
  progress_percentage,
}) => {
  if (project_id === undefined || project_id === null) {
    throw new AppError("project_id is required", 422, "VALIDATION_ERROR");
  }

  const taskTitle = title.trim();
  const finalStatus = status || DEFAULTS.status;
  const finalUrgency = urgency_priority || DEFAULTS.urgency_priority;
  const finalAgility = agile_importance || DEFAULTS.agile_importance;

  assertValidEnums({
    status: finalStatus,
    urgencyPriority: finalUrgency,
    agileImportance: finalAgility,
  });

  assertValidDates({ startDate: start_date, dueDate: due_date });

  await resolveProjectForMutation({ user, projectId: project_id });

  const finalCategoryId = await resolveCategoryReference({ user, categoryId: category_id });
  const finalAssigneeId = await resolveAssignee({ projectId: project_id, assigneeId: assigned_to });
  const finalParentId = await resolveParentReference({
    projectId: project_id,
    taskId: null,
    parentTaskId: parent_task_id,
  });

  let finalProgress = progress_percentage === undefined ? 0 : progress_percentage;
  let finalCompletedAt = null;

  if (finalStatus === "done") {
    finalProgress = 100;
    finalCompletedAt = new Date();
  } else if (Number(finalProgress) >= 100) {
    throw new AppError(
      'progress_percentage must be less than 100 when status is not "done"',
      422,
      "INVALID_PROGRESS"
    );
  }

  const task = await taskRepository.create({
    project_id,
    created_by: user.user_id,
    assigned_to: finalAssigneeId,
    category_id: finalCategoryId,
    parent_task_id: finalParentId,
    title: taskTitle,
    description,
    status: finalStatus,
    urgency_priority: finalUrgency,
    agile_importance: finalAgility,
    start_date,
    due_date,
    estimated_minutes,
    actual_minutes,
    progress_percentage: finalProgress,
    completed_at: finalCompletedAt,
  });

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "TASK_CREATED",
    description: `Task created: ${task.title}`,
  });

  return task;
};

const updateTask = async ({ user, taskId, body }) => {
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404, NOT_FOUND_CODE);
  }

  const roles = await taskProjectRoles(user, task);

  if (!canModify(roles)) {
    throw new ForbiddenError(
      "You do not have permission to update this task"
    );
  }

  const fields = pickUpdateFields(body);

  if (fields.title !== undefined) {
    fields.title = fields.title.trim();
  }

  if (fields.project_id !== undefined) {
    fields.project_id = await resolveProjectForMutation({
      user,
      projectId: fields.project_id,
    });
  }

  const effectiveProjectId =
    fields.project_id !== undefined ? fields.project_id : task.project_id;

  if (fields.assigned_to !== undefined) {
    fields.assigned_to = await resolveAssignee({
      projectId: effectiveProjectId,
      assigneeId: fields.assigned_to,
    });
  }

  if (fields.category_id !== undefined) {
    fields.category_id = await resolveCategoryReference({
      user,
      categoryId: fields.category_id,
    });
  }

  if (fields.parent_task_id !== undefined) {
    fields.parent_task_id = await resolveParentReference({
      projectId: effectiveProjectId,
      taskId,
      parentTaskId: fields.parent_task_id,
    });
  }

  assertValidEnums({
    status: fields.status,
    urgencyPriority: fields.urgency_priority,
    agileImportance: fields.agile_importance,
  });

  assertValidDates({
    startDate: fields.start_date !== undefined ? fields.start_date : task.start_date,
    dueDate: fields.due_date !== undefined ? fields.due_date : task.due_date,
  });

  applyCompletionRules(task, fields);

  const updated = await taskRepository.update(taskId, fields);

  if (!updated) {
    throw new AppError("Task not found", 404, NOT_FOUND_CODE);
  }

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "TASK_UPDATED",
    description: `Task updated: ${updated.title}`,
  });

  return updated;
};

const changeTaskStatus = async ({ user, taskId, status }) => {
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404, NOT_FOUND_CODE);
  }

  const roles = await taskProjectRoles(user, task);

  if (!canModify(roles)) {
    throw new ForbiddenError(
      "You do not have permission to change this task's status"
    );
  }

  if (!isAllowedStatus(status)) {
    throw new AppError("Invalid task status", 422, "INVALID_STATUS");
  }

  const fields = { status };
  applyCompletionRules(task, fields);

  const updated = await taskRepository.update(taskId, fields);

  if (!updated) {
    throw new AppError("Task not found", 404, NOT_FOUND_CODE);
  }

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "TASK_STATUS_CHANGED",
    description: `Task "${updated.title}" status changed to "${status}"`,
  });

  return updated;
};

const deleteTask = async ({ user, taskId }) => {
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404, NOT_FOUND_CODE);
  }

  const roles = await taskProjectRoles(user, task);

  if (!canDelete(roles)) {
    throw new ForbiddenError(
      "You do not have permission to delete this task"
    );
  }

  const deleted = await taskRepository.remove(taskId);

  if (!deleted) {
    throw new AppError("Task not found", 404, NOT_FOUND_CODE);
  }

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "TASK_DELETED",
    description: `Task deleted: ${task.title}`,
  });

  return { task_id: Number(taskId) };
};

module.exports = {
  getTask,
  getTasks,
  createTask,
  updateTask,
  changeTaskStatus,
  deleteTask,
};
