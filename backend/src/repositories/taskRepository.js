const { query } = require("../config/db");

const TASK_COLUMNS = `
  t.task_id,
  t.project_id,
  t.created_by,
  t.assigned_to,
  t.category_id,
  t.parent_task_id,
  t.title,
  t.description,
  t.status,
  t.urgency_priority,
  t.agile_importance,
  t.start_date,
  t.due_date,
  t.estimated_minutes,
  t.actual_minutes,
  t.progress_percentage,
  t.completed_at,
  t.created_at,
  t.updated_at,
  p.project_name,
  p.project_key,
  c.category_name,
  creator.full_name AS created_by_name,
  assignee.full_name AS assigned_to_name,
  parent.title AS parent_task_title
`;

const TASK_JOINS = `
  LEFT JOIN projects p ON p.project_id = t.project_id
  LEFT JOIN categories c ON c.category_id = t.category_id
  LEFT JOIN users creator ON creator.user_id = t.created_by
  LEFT JOIN users assignee ON assignee.user_id = t.assigned_to
  LEFT JOIN tasks parent ON parent.task_id = t.parent_task_id
`;

const TASK_FROM = `
  FROM tasks t
${TASK_JOINS}`;

const INSERTED_TASK_COLUMNS = `
  i.task_id,
  i.project_id,
  i.created_by,
  i.assigned_to,
  i.category_id,
  i.parent_task_id,
  i.title,
  i.description,
  i.status,
  i.urgency_priority,
  i.agile_importance,
  i.start_date,
  i.due_date,
  i.estimated_minutes,
  i.actual_minutes,
  i.progress_percentage,
  i.completed_at,
  i.created_at,
  i.updated_at,
  p.project_name,
  p.project_key,
  c.category_name,
  creator.full_name AS created_by_name,
  assignee.full_name AS assigned_to_name,
  parent.title AS parent_task_title
`;

const INSERTED_TASK_JOINS = `
  LEFT JOIN projects p ON p.project_id = i.project_id
  LEFT JOIN categories c ON c.category_id = i.category_id
  LEFT JOIN users creator ON creator.user_id = i.created_by
  LEFT JOIN users assignee ON assignee.user_id = i.assigned_to
  LEFT JOIN tasks parent ON parent.task_id = i.parent_task_id
`;

const TASK_COLUMN_MAP = Object.freeze({
  title: "title",
  description: "description",
  status: "status",
  urgency_priority: "urgency_priority",
  agile_importance: "agile_importance",
  start_date: "start_date",
  due_date: "due_date",
  estimated_minutes: "estimated_minutes",
  actual_minutes: "actual_minutes",
  progress_percentage: "progress_percentage",
  project_id: "project_id",
  category_id: "category_id",
  assigned_to: "assigned_to",
  parent_task_id: "parent_task_id",
  completed_at: "completed_at",
});

const buildFilterClauses = (clauses, values, filters) => {
  let index = values.length + 1;

  const push = (column, value) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    clauses.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  };

  push("t.status", filters.status);
  push("t.urgency_priority", filters.urgency_priority);
  push("t.agile_importance", filters.agile_importance);
  push("t.project_id", filters.project_id);
  push("t.category_id", filters.category_id);
  push("t.assigned_to", filters.assigned_to);
  push("t.created_by", filters.created_by);
};

const findById = async (taskId) => {
  const result = await query(
    `SELECT ${TASK_COLUMNS}
     ${TASK_FROM}
     WHERE t.task_id = $1`,
    [taskId]
  );

  return result.rows[0] || null;
};

const findAll = async (filters = {}) => {
  const clauses = [];
  const values = [];

  buildFilterClauses(clauses, values, filters);

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await query(
    `SELECT ${TASK_COLUMNS}
     ${TASK_FROM}
     ${where}
     ORDER BY t.created_at DESC, t.task_id DESC`,
    values
  );

  return result.rows;
};

const findAccessibleTasks = async ({ userId, isAdmin, filters = {} }) => {
  const clauses = [];
  const values = [];

  if (!isAdmin) {
    clauses.push(
      `(p.owner_id = $1 OR EXISTS (
         SELECT 1 FROM project_members pm
         WHERE pm.project_id = t.project_id AND pm.user_id = $1
       ))`
    );
    values.push(userId);
  }

  buildFilterClauses(clauses, values, filters);

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await query(
    `SELECT ${TASK_COLUMNS}
     ${TASK_FROM}
     ${where}
     ORDER BY t.created_at DESC, t.task_id DESC`,
    values
  );

  return result.rows;
};

const create = async ({
  project_id,
  created_by,
  assigned_to,
  category_id,
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
  completed_at,
}) => {
  const result = await query(
    `WITH inserted AS (
       INSERT INTO tasks (
         project_id,
         created_by,
         assigned_to,
         category_id,
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
         completed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *
     )
     SELECT ${INSERTED_TASK_COLUMNS}
     FROM inserted i
${INSERTED_TASK_JOINS}`,
    [
      project_id,
      created_by,
      assigned_to === undefined ? null : assigned_to,
      category_id === undefined ? null : category_id,
      parent_task_id === undefined ? null : parent_task_id,
      title,
      description === undefined ? null : description,
      status,
      urgency_priority,
      agile_importance,
      start_date === undefined ? null : start_date,
      due_date === undefined ? null : due_date,
      estimated_minutes === undefined ? null : estimated_minutes,
      actual_minutes === undefined ? 0 : actual_minutes,
      progress_percentage === undefined ? 0 : progress_percentage,
      completed_at === undefined ? null : completed_at,
    ]
  );

  return result.rows[0];
};

const update = async (taskId, fields) => {
  const sets = [];
  const values = [];
  let paramIndex = 1;

  for (const [field, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }

    const column = TASK_COLUMN_MAP[field];
    if (!column) {
      continue;
    }

    sets.push(`${column} = $${paramIndex}`);
    values.push(value);
    paramIndex += 1;
  }

  if (sets.length === 0) {
    return findById(taskId);
  }

  sets.push("updated_at = CURRENT_TIMESTAMP");
  values.push(taskId);

  const result = await query(
    `UPDATE tasks
     SET ${sets.join(", ")}
     WHERE task_id = $${paramIndex}
     RETURNING task_id`,
    values
  );

  if (result.rowCount === 0) {
    return null;
  }

  return findById(taskId);
};

const remove = async (taskId) => {
  const result = await query("DELETE FROM tasks WHERE task_id = $1", [taskId]);

  return result.rowCount > 0;
};

const findAncestorIds = async (taskId) => {
  const result = await query(
    `WITH RECURSIVE ancestors AS (
       SELECT parent_task_id AS ancestor_id
       FROM tasks
       WHERE task_id = $1 AND parent_task_id IS NOT NULL
       UNION ALL
       SELECT t.parent_task_id
       FROM tasks t
       JOIN ancestors a ON t.task_id = a.ancestor_id
       WHERE t.parent_task_id IS NOT NULL
     )
     SELECT ancestor_id AS task_id FROM ancestors`,
    [taskId]
  );

  return result.rows;
};

module.exports = {
  findById,
  findAll,
  findAccessibleTasks,
  create,
  update,
  remove,
  findAncestorIds,
};
