const { query } = require("../config/db");

const PUBLIC_COLUMNS = `
  user_id,
  full_name,
  email,
  role,
  is_active,
  created_at,
  updated_at
`;

const findByEmail = async (email) => {
  const result = await query(
    `SELECT
       user_id,
       full_name,
       email,
       password_hash,
       role,
       is_active,
       created_at,
       updated_at
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
  );

  return result.rows[0] || null;
};

const findById = async (userId) => {
  const result = await query(
    `SELECT ${PUBLIC_COLUMNS}
     FROM users
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
};

const createUser = async ({
  fullName,
  email,
  passwordHash,
  role = "user",
  isActive = true,
}) => {
  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PUBLIC_COLUMNS}`,
    [fullName, email.toLowerCase(), passwordHash, role, isActive]
  );

  return result.rows[0];
};

const findAdminExists = async () => {
  const result = await query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");

  return result.rowCount > 0;
};

const emailExists = async (email) => {
  const result = await query("SELECT 1 FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  return result.rowCount > 0;
};

const updateLastLogin = async (userId) => {
  const columnExists = await query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'users'
       AND column_name = 'last_login'`
  );

  if (columnExists.rowCount === 0) {
    return;
  }

  await query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1", [
    userId,
  ]);
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  findAdminExists,
  emailExists,
  updateLastLogin,
};
