const { query } = require("../config/db");

const NOTIFICATION_COLUMNS = `
  notification_id,
  user_id,
  task_id,
  project_id,
  notification_type,
  title,
  message,
  is_read,
  created_at
`;

const findByUser = async (userId, filters = {}) => {
  const conditions = ["user_id = $1"];
  const values = [userId];
  let paramIndex = 2;

  const addFilter = (column, value) => {
    if (value !== undefined && value !== null) {
      conditions.push(`${column} = $${paramIndex}`);
      values.push(value);
      paramIndex += 1;
    }
  };

  addFilter("is_read", filters.is_read);
  addFilter("notification_type", filters.notification_type);
  addFilter("project_id", filters.project_id);
  addFilter("task_id", filters.task_id);

  const result = await query(
    `SELECT ${NOTIFICATION_COLUMNS}
     FROM notifications
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC, notification_id DESC`,
    values
  );

  return result.rows;
};

const findById = async (notificationId) => {
  const result = await query(
    `SELECT ${NOTIFICATION_COLUMNS}
     FROM notifications
     WHERE notification_id = $1`,
    [notificationId]
  );

  return result.rows[0] || null;
};

const create = async ({
  userId,
  taskId,
  projectId,
  notificationType,
  title,
  message,
}) => {
  const result = await query(
    `INSERT INTO notifications (
       user_id,
       task_id,
       project_id,
       notification_type,
       title,
       message
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING notification_id`,
    [userId, taskId || null, projectId || null, notificationType, title, message]
  );

  return findById(result.rows[0].notification_id);
};

const markAsRead = async (notificationId, userId) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = true
     WHERE notification_id = $1 AND user_id = $2
     RETURNING ${NOTIFICATION_COLUMNS}`,
    [notificationId, userId]
  );

  return result.rows[0] || null;
};

const markAllAsRead = async (userId) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1
       AND is_read = false`,
    [userId]
  );

  return result.rowCount;
};

const remove = async (notificationId, userId) => {
  const result = await query(
    "DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2",
    [notificationId, userId]
  );

  return result.rowCount > 0;
};

const countUnread = async (userId) => {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM notifications
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  return result.rows[0].count;
};

module.exports = {
  findByUser,
  findById,
  create,
  markAsRead,
  markAllAsRead,
  delete: remove,
  countUnread,
};
