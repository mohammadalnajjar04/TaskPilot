const taskRepository = require("../repositories/taskRepository");
const projectRepository = require("../repositories/projectRepository");
const taskAttachmentRepository = require("../repositories/taskAttachmentRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const { AppError, ForbiddenError } = require("../utils/errors");

const TASK_NOT_FOUND_CODE = "TASK_NOT_FOUND";
const ATTACHMENT_NOT_FOUND_CODE = "ATTACHMENT_NOT_FOUND";
const INVALID_FILE_METADATA_CODE = "INVALID_FILE_METADATA";

const isAdmin = (user) => user.role === "admin";

const getTaskOrThrow = async (taskId) => {
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404, TASK_NOT_FOUND_CODE);
  }

  return task;
};

const getAttachmentOrThrow = async (taskId, attachmentId) => {
  const attachment = await taskAttachmentRepository.findById(attachmentId);

  if (
    !attachment ||
    Number(attachment.task_id) !== Number(taskId)
  ) {
    throw new AppError(
      "Attachment not found",
      404,
      ATTACHMENT_NOT_FOUND_CODE
    );
  }

  return attachment;
};

const computeTaskRoles = async (user, task) => {
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
      roles.owner ||
      (await projectRepository.isMember(task.project_id, user.user_id));
  }

  return roles;
};

const assertCanViewTask = async (user, task) => {
  const roles = await computeTaskRoles(user, task);

  if (
    !(
      roles.admin ||
      roles.owner ||
      roles.member ||
      roles.creator ||
      roles.assignee
    )
  ) {
    throw new ForbiddenError(
      "You do not have permission to access this task"
    );
  }

  return roles;
};

const validateFileMetadata = (fileMetadata) => {
  const metadata = fileMetadata || {};

  const fileName =
    typeof metadata.fileName === "string" ? metadata.fileName.trim() : "";
  const filePath =
    typeof metadata.filePath === "string" ? metadata.filePath.trim() : "";
  const mimeType =
    typeof metadata.mimeType === "string" ? metadata.mimeType.trim() : "";
  const fileSize = metadata.fileSize;

  const invalid =
    !fileName ||
    !filePath ||
    !mimeType ||
    typeof fileSize !== "number" ||
    !Number.isFinite(fileSize) ||
    fileSize <= 0;

  if (invalid) {
    throw new AppError(
      "Invalid file metadata",
      422,
      INVALID_FILE_METADATA_CODE
    );
  }

  return { fileName, filePath, mimeType, fileSize };
};

const listAttachments = async (taskId, actor) => {
  const task = await getTaskOrThrow(taskId);

  await assertCanViewTask(actor, task);

  return taskAttachmentRepository.findByTaskId(taskId);
};

const getAttachment = async (taskId, attachmentId, actor) => {
  const task = await getTaskOrThrow(taskId);

  await assertCanViewTask(actor, task);

  return getAttachmentOrThrow(taskId, attachmentId);
};

const createAttachment = async (taskId, actor, fileMetadata) => {
  const task = await getTaskOrThrow(taskId);

  await assertCanViewTask(actor, task);

  const metadata = validateFileMetadata(fileMetadata);

  const attachment = await taskAttachmentRepository.create({
    taskId,
    uploadedBy: actor.user_id,
    fileName: metadata.fileName,
    filePath: metadata.filePath,
    mimeType: metadata.mimeType,
    fileSize: metadata.fileSize,
  });

  await activityLogRepository.logActivity({
    userId: actor.user_id,
    activityType: "TASK_ATTACHMENT_CREATED",
    description: `Attachment "${metadata.fileName}" uploaded to task "${task.title}"`,
    projectId: task.project_id,
    taskId,
  });

  return attachment;
};

const deleteAttachment = async (taskId, attachmentId, actor) => {
  const task = await getTaskOrThrow(taskId);

  const attachment = await getAttachmentOrThrow(taskId, attachmentId);

  const roles = await computeTaskRoles(actor, task);

  const isUploader =
    Number(attachment.uploaded_by) === Number(actor.user_id);

  if (!roles.admin && !roles.owner && !isUploader) {
    throw new ForbiddenError(
      "You do not have permission to delete this attachment"
    );
  }

  await taskAttachmentRepository.delete(attachmentId);

  await activityLogRepository.logActivity({
    userId: actor.user_id,
    activityType: "TASK_ATTACHMENT_DELETED",
    description: `Attachment "${attachment.file_name}" deleted from task "${task.title}"`,
    projectId: task.project_id,
    taskId,
  });

  return attachment;
};

module.exports = {
  listAttachments,
  getAttachment,
  createAttachment,
  deleteAttachment,
};
