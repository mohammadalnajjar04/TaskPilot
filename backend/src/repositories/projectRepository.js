const { pool, query } = require("../config/db");

const PROJECT_COLUMNS = `
  project_id,
  owner_id,
  project_key,
  project_name,
  description,
  status,
  progress_percentage,
  start_date,
  end_date,
  created_at,
  updated_at
`;

const PROJECT_COLUMN_MAP = Object.freeze({
  project_key: "project_key",
  project_name: "project_name",
  description: "description",
  status: "status",
  start_date: "start_date",
  end_date: "end_date",
  progress_percentage: "progress_percentage",
});

const findById = async (projectId) => {
  const result = await query(
    `SELECT ${PROJECT_COLUMNS}
     FROM projects
     WHERE project_id = $1`,
    [projectId]
  );

  return result.rows[0] || null;
};

const findByOwner = async (ownerId) => {
  const result = await query(
    `SELECT ${PROJECT_COLUMNS}
     FROM projects
     WHERE owner_id = $1
     ORDER BY created_at DESC, project_id DESC`,
    [ownerId]
  );

  return result.rows;
};

const findByOwnerAndName = async (ownerId, projectName) => {
  const result = await query(
    `SELECT project_id
     FROM projects
     WHERE owner_id = $1
       AND LOWER(project_name) = LOWER($2)`,
    [ownerId, projectName]
  );

  return result.rows[0] || null;
};

const findByKey = async (projectKey) => {
  const result = await query(
    "SELECT project_id FROM projects WHERE project_key = $1",
    [projectKey]
  );

  return result.rows[0] || null;
};

const findAll = async () => {
  const result = await query(
    `SELECT ${PROJECT_COLUMNS}
     FROM projects
     ORDER BY created_at DESC, project_id DESC`
  );

  return result.rows;
};

const findAccessibleProjects = async ({ userId, isAdmin }) => {
  if (isAdmin) {
    return findAll();
  }

  const result = await query(
    `SELECT ${PROJECT_COLUMNS}
     FROM projects
     WHERE owner_id = $1
        OR project_id IN (
             SELECT project_id
             FROM project_members
             WHERE user_id = $1
           )
     ORDER BY created_at DESC, project_id DESC`,
    [userId]
  );

  return result.rows;
};

const isMember = async (projectId, userId) => {
  const result = await query(
    `SELECT 1
     FROM project_members
     WHERE project_id = $1
       AND user_id = $2`,
    [projectId, userId]
  );

  return result.rowCount > 0;
};

const exists = async (projectId) => {
  const result = await query(
    "SELECT 1 FROM projects WHERE project_id = $1",
    [projectId]
  );

  return result.rowCount > 0;
};

const create = async ({
  owner_id,
  project_key,
  project_name,
  description,
  status,
  progress_percentage,
  start_date,
  end_date,
}) => {
  const result = await query(
    `INSERT INTO projects (
       owner_id,
       project_key,
       project_name,
       description,
       status,
       progress_percentage,
       start_date,
       end_date
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${PROJECT_COLUMNS}`,
    [
      owner_id,
      project_key,
      project_name,
      description === undefined ? null : description,
      status,
      progress_percentage === undefined ? 0 : progress_percentage,
      start_date === undefined ? null : start_date,
      end_date === undefined ? null : end_date,
    ]
  );

  return result.rows[0];
};

const update = async (projectId, fields) => {
  const sets = [];
  const values = [];
  let paramIndex = 1;

  for (const [field, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      continue;
    }

    const column = PROJECT_COLUMN_MAP[field];
    if (!column) {
      continue;
    }

    sets.push(`${column} = $${paramIndex}`);
    values.push(value);
    paramIndex += 1;
  }

  if (sets.length === 0) {
    return findById(projectId);
  }

  sets.push("updated_at = CURRENT_TIMESTAMP");
  values.push(projectId);

  const result = await query(
    `UPDATE projects
     SET ${sets.join(", ")}
     WHERE project_id = $${paramIndex}
     RETURNING ${PROJECT_COLUMNS}`,
    values
  );

  return result.rows[0] || null;
};

const remove = async (projectId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM project_members WHERE project_id = $1",
      [projectId]
    );

    const result = await client.query(
      "DELETE FROM projects WHERE project_id = $1",
      [projectId]
    );

    await client.query("COMMIT");

    return result.rowCount > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findById,
  findByOwner,
  findByOwnerAndName,
  findByKey,
  findAll,
  findAccessibleProjects,
  isMember,
  exists,
  create,
  update,
  remove,
};
