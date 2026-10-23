const projectRepository = require("../repositories/projectRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const {
  isAllowedStatus,
  isAllowedTransition,
} = require("../utils/projectStatus");
const {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require("../utils/errors");

const NOT_FOUND_CODE = "PROJECT_NOT_FOUND";
const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

const isAdmin = (user) => user.role === "admin";

const isOwner = (project, user) => project.owner_id === user.user_id;

const canManage = (project, user) => isAdmin(user) || isOwner(project, user);

const validateDateRange = (startDate, endDate) => {
  if (
    startDate &&
    endDate &&
    new Date(endDate) < new Date(startDate)
  ) {
    throw new AppError(
      "End date cannot be before start date",
      422,
      "INVALID_DATE_RANGE"
    );
  }
};

const pickUpdateFields = (body) => {
  const fields = {};

  for (const key of [
    "project_key",
    "project_name",
    "description",
    "start_date",
    "end_date",
    "progress_percentage",
    "status",
  ]) {
    if (body[key] !== undefined && body[key] !== null) {
      fields[key] = body[key];
    }
  }

  return fields;
};

const normalizeProjectKey = (projectKey) => {
  const key = String(projectKey).trim().toUpperCase();

  if (!PROJECT_KEY_PATTERN.test(key)) {
    throw new AppError(
      "Project key must start with a letter and contain only uppercase letters and digits",
      422,
      "VALIDATION_ERROR"
    );
  }

  return key;
};

const getProject = async ({ user, projectId }) => {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404, NOT_FOUND_CODE);
  }

  const accessible =
    isAdmin(user) ||
    isOwner(project, user) ||
    (await projectRepository.isMember(projectId, user.user_id));

  if (!accessible) {
    throw new ForbiddenError(
      "You do not have permission to access this project"
    );
  }

  return project;
};

const getProjects = async ({ user }) => {
  return projectRepository.findAccessibleProjects({
    userId: user.user_id,
    isAdmin: isAdmin(user),
  });
};

const createProject = async ({
  user,
  project_key,
  project_name,
  description,
  status,
  start_date,
  end_date,
  progress_percentage,
}) => {
  if (!project_key || !project_key.trim()) {
    throw new AppError("Project key is required", 422, "VALIDATION_ERROR");
  }

  const projectKey = normalizeProjectKey(project_key);
  const projectName = project_name.trim();

  const existingKey = await projectRepository.findByKey(projectKey);

  if (existingKey) {
    throw new ConflictError(
      "A project with this key already exists",
      "PROJECT_KEY_ALREADY_EXISTS"
    );
  }

  const duplicate = await projectRepository.findByOwnerAndName(
    user.user_id,
    projectName
  );

  if (duplicate) {
    throw new ConflictError(
      "A project with this name already exists",
      "PROJECT_NAME_ALREADY_EXISTS"
    );
  }

  const finalStatus = status || "planning";

  if (!isAllowedStatus(finalStatus)) {
    throw new AppError("Invalid project status", 422, "INVALID_STATUS");
  }

  const finalProgress =
    progress_percentage === undefined ? 0 : progress_percentage;

  if (finalStatus === "completed" && finalProgress !== 100) {
    throw new AppError(
      "A completed project must have 100% progress",
      422,
      "INVALID_PROGRESS"
    );
  }

  validateDateRange(start_date, end_date);

  const project = await projectRepository.create({
    owner_id: user.user_id,
    project_key: projectKey,
    project_name: projectName,
    description,
    status: finalStatus,
    progress_percentage: finalProgress,
    start_date,
    end_date,
  });

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "PROJECT_CREATED",
    description: `Project created: ${project.project_name}`,
  });

  return project;
};

const updateProject = async ({ user, projectId, body }) => {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404, NOT_FOUND_CODE);
  }

  if (!canManage(project, user)) {
    throw new ForbiddenError(
      "You do not have permission to update this project"
    );
  }

  const fields = pickUpdateFields(body);

  if (fields.project_key !== undefined) {
    fields.project_key = normalizeProjectKey(fields.project_key);

    const existingKey = await projectRepository.findByKey(fields.project_key);

    if (existingKey && Number(existingKey.project_id) !== Number(projectId)) {
      throw new ConflictError(
        "A project with this key already exists",
        "PROJECT_KEY_ALREADY_EXISTS"
      );
    }
  }

  if (fields.project_name !== undefined) {
    fields.project_name = fields.project_name.trim();

    const duplicate = await projectRepository.findByOwnerAndName(
      user.user_id,
      fields.project_name
    );

    if (duplicate && Number(duplicate.project_id) !== Number(projectId)) {
      throw new ConflictError(
        "A project with this name already exists",
        "PROJECT_NAME_ALREADY_EXISTS"
      );
    }
  }

  validateDateRange(fields.start_date, fields.end_date);

  const targetStatus =
    fields.status === undefined ? project.status : fields.status;
  const targetProgress =
    fields.progress_percentage === undefined
      ? project.progress_percentage
      : fields.progress_percentage;

  if (fields.status !== undefined && fields.status !== project.status) {
    if (!isAllowedTransition(project.status, fields.status)) {
      throw new AppError(
        `Cannot change project status from "${project.status}" to "${fields.status}"`,
        422,
        "INVALID_STATUS_TRANSITION"
      );
    }
  }

  if (targetStatus === "completed" && targetProgress !== 100) {
    throw new AppError(
      "A completed project must have 100% progress",
      422,
      "INVALID_PROGRESS"
    );
  }

  if (project.status === "completed" && targetProgress < 100) {
    throw new AppError(
      "Progress cannot be lowered below 100% on a completed project",
      422,
      "INVALID_PROGRESS"
    );
  }

  const updated = await projectRepository.update(projectId, fields);

  if (!updated) {
    throw new AppError("Project not found", 404, NOT_FOUND_CODE);
  }

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "PROJECT_UPDATED",
    description: `Project updated: ${updated.project_name}`,
  });

  return updated;
};

const changeProjectStatus = async ({ user, projectId, status }) => {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404, NOT_FOUND_CODE);
  }

  if (!canManage(project, user)) {
    throw new ForbiddenError(
      "You do not have permission to change this project's status"
    );
  }

  if (!isAllowedStatus(status)) {
    throw new AppError("Invalid project status", 422, "INVALID_STATUS");
  }

  if (status !== project.status && !isAllowedTransition(project.status, status)) {
    throw new AppError(
      `Cannot change project status from "${project.status}" to "${status}"`,
      422,
      "INVALID_STATUS_TRANSITION"
    );
  }

  const fields = { status };

  if (status === "completed") {
    fields.progress_percentage = 100;
  }

  const updated = await projectRepository.update(projectId, fields);

  if (!updated) {
    throw new AppError("Project not found", 404, NOT_FOUND_CODE);
  }

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "PROJECT_STATUS_CHANGED",
    description: `Project "${updated.project_name}" status changed to "${status}"`,
  });

  return updated;
};

const deleteProject = async ({ user, projectId }) => {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404, NOT_FOUND_CODE);
  }

  if (!canManage(project, user)) {
    throw new ForbiddenError(
      "You do not have permission to delete this project"
    );
  }

  const deleted = await projectRepository.remove(projectId);

  if (!deleted) {
    throw new AppError("Project not found", 404, NOT_FOUND_CODE);
  }

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "PROJECT_DELETED",
    description: `Project deleted: ${project.project_name}`,
  });

  return { project_id: Number(projectId) };
};

module.exports = {
  getProject,
  getProjects,
  createProject,
  updateProject,
  changeProjectStatus,
  deleteProject,
};
