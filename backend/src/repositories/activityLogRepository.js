const { query } = require("../config/db");
const config = require("../config/env");

const logActivity = async ({
  userId,
  activityType,
  description,
  projectId,
  taskId,
}) => {
  try {
    const tableExists = await query(
      "SELECT to_regclass('public.activity_logs') AS table_name"
    );

    if (!tableExists.rows[0].table_name) {
      return;
    }

    await query(
      `INSERT INTO activity_logs
         (user_id, project_id, task_id, action_type, action_description)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        projectId || null,
        taskId || null,
        activityType,
        description || null,
      ]
    );
  } catch (error) {
    if (config.nodeEnv !== "production") {
      console.warn("Activity log skipped:", error.message);
    }
  }
};

module.exports = {
  logActivity,
};
