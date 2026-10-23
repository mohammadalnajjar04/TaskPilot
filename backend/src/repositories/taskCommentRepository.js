const { query } = require("../config/db");

const COMMENT_SELECT = `
  c.comment_id,
  c.task_id,
  c.user_id,
  c.comment_text,
  c.created_at,
  c.updated_at,
  u.full_name,
  u.email
`;

const COMMENT_FROM = `
  FROM task_comments c
  JOIN users u ON u.user_id = c.user_id
`;

const findByTaskId = async (taskId) => {
  const result = await query(
    `SELECT ${COMMENT_SELECT}
     ${COMMENT_FROM}
     WHERE c.task_id = $1
     ORDER BY c.created_at ASC, c.comment_id ASC`,
    [taskId]
  );

  return result.rows;
};

const findById = async (commentId) => {
  const result = await query(
    `SELECT ${COMMENT_SELECT}
     ${COMMENT_FROM}
     WHERE c.comment_id = $1`,
    [commentId]
  );

  return result.rows[0] || null;
};

const create = async ({ taskId, userId, commentText }) => {
  const result = await query(
    `INSERT INTO task_comments (task_id, user_id, comment_text)
     VALUES ($1, $2, $3)
     RETURNING comment_id`,
    [taskId, userId, commentText]
  );

  return findById(result.rows[0].comment_id);
};

const update = async ({ commentId, commentText }) => {
  await query(
    `UPDATE task_comments
     SET comment_text = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE comment_id = $1`,
    [commentId, commentText]
  );

  return findById(commentId);
};

const remove = async (commentId) => {
  const result = await query(
    "DELETE FROM task_comments WHERE comment_id = $1",
    [commentId]
  );

  return result.rowCount > 0;
};

const findCommentInTask = async (taskId, commentId) => {
  const comment = await findById(commentId);

  if (!comment || Number(comment.task_id) !== Number(taskId)) {
    return null;
  }

  return comment;
};

const removeFromTask = async (taskId, commentId) => {
  const result = await query(
    "DELETE FROM task_comments WHERE task_id = $1 AND comment_id = $2",
    [taskId, commentId]
  );

  return result.rowCount > 0;
};

module.exports = {
  findByTaskId,
  findById,
  create,
  update,
  delete: remove,
  listComments: findByTaskId,
  findComment: findCommentInTask,
  createComment: create,
  updateCommentText: update,
  deleteComment: removeFromTask,
};
