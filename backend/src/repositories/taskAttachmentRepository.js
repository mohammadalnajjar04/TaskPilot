const { query } = require("../config/db");

const ATTACHMENT_SELECT = `
  a.attachment_id,
  a.task_id,
  a.uploaded_by,
  a.file_name,
  a.file_path,
  a.mime_type,
  a.file_size,
  a.uploaded_at,
  u.user_id AS uploader_user_id,
  u.full_name AS uploader_full_name,
  u.email AS uploader_email
`;

const ATTACHMENT_FROM = `
  FROM task_attachments a
  JOIN users u ON u.user_id = a.uploaded_by
`;

const findByTaskId = async (taskId) => {
  const result = await query(
    `SELECT ${ATTACHMENT_SELECT}
     ${ATTACHMENT_FROM}
     WHERE a.task_id = $1
     ORDER BY a.uploaded_at ASC, a.attachment_id ASC`,
    [taskId]
  );

  return result.rows;
};

const findById = async (attachmentId) => {
  const result = await query(
    `SELECT ${ATTACHMENT_SELECT}
     ${ATTACHMENT_FROM}
     WHERE a.attachment_id = $1`,
    [attachmentId]
  );

  return result.rows[0] || null;
};

const create = async ({
  taskId,
  uploadedBy,
  fileName,
  filePath,
  mimeType,
  fileSize,
}) => {
  const result = await query(
    `INSERT INTO task_attachments (
       task_id,
       uploaded_by,
       file_name,
       file_path,
       mime_type,
       file_size
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING attachment_id`,
    [taskId, uploadedBy, fileName, filePath, mimeType, fileSize]
  );

  return findById(result.rows[0].attachment_id);
};

const remove = async (attachmentId) => {
  const result = await query(
    "DELETE FROM task_attachments WHERE attachment_id = $1",
    [attachmentId]
  );

  return result.rowCount > 0;
};

module.exports = {
  findByTaskId,
  findById,
  create,
  delete: remove,
};
