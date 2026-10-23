const { query } = require("../config/db");

const CATEGORY_COLUMNS = `
  category_id,
  user_id,
  category_name,
  color,
  created_at
`;

const CATEGORY_COLUMN_MAP = Object.freeze({
  category_name: "category_name",
  color: "color",
});

const findById = async (categoryId) => {
  const result = await query(
    `SELECT ${CATEGORY_COLUMNS}
     FROM categories
     WHERE category_id = $1`,
    [categoryId]
  );

  return result.rows[0] || null;
};

const findByUser = async (userId) => {
  const result = await query(
    `SELECT ${CATEGORY_COLUMNS}
     FROM categories
     WHERE user_id = $1
     ORDER BY category_name ASC, category_id ASC`,
    [userId]
  );

  return result.rows;
};

const findByUserAndName = async (userId, categoryName) => {
  const result = await query(
    `SELECT category_id
     FROM categories
     WHERE user_id = $1
       AND LOWER(category_name) = LOWER($2)`,
    [userId, categoryName]
  );

  return result.rows[0] || null;
};

const findAll = async () => {
  const result = await query(
    `SELECT ${CATEGORY_COLUMNS}
     FROM categories
     ORDER BY category_name ASC, category_id ASC`
  );

  return result.rows;
};

const exists = async (categoryId) => {
  const result = await query(
    "SELECT 1 FROM categories WHERE category_id = $1",
    [categoryId]
  );

  return result.rowCount > 0;
};

const create = async ({ user_id, category_name, color }) => {
  if (color === undefined || color === null) {
    const result = await query(
      `INSERT INTO categories (user_id, category_name)
       VALUES ($1, $2)
       RETURNING ${CATEGORY_COLUMNS}`,
      [user_id, category_name]
    );

    return result.rows[0];
  }

  const result = await query(
    `INSERT INTO categories (user_id, category_name, color)
     VALUES ($1, $2, $3)
     RETURNING ${CATEGORY_COLUMNS}`,
    [user_id, category_name, color]
  );

  return result.rows[0];
};

const update = async (categoryId, fields) => {
  const sets = [];
  const values = [];
  let paramIndex = 1;

  for (const [field, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      continue;
    }

    const column = CATEGORY_COLUMN_MAP[field];
    if (!column) {
      continue;
    }

    sets.push(`${column} = $${paramIndex}`);
    values.push(value);
    paramIndex += 1;
  }

  if (sets.length === 0) {
    return findById(categoryId);
  }

  values.push(categoryId);

  const result = await query(
    `UPDATE categories
     SET ${sets.join(", ")}
     WHERE category_id = $${paramIndex}
     RETURNING ${CATEGORY_COLUMNS}`,
    values
  );

  return result.rows[0] || null;
};

const remove = async (categoryId) => {
  const result = await query(
    "DELETE FROM categories WHERE category_id = $1",
    [categoryId]
  );

  return result.rowCount > 0;
};

module.exports = {
  findById,
  findByUser,
  findByUserAndName,
  findAll,
  exists,
  create,
  update,
  remove,
};
