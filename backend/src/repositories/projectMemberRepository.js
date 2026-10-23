const { query } = require("../config/db");

const MEMBER_SELECT = `
  pm.project_member_id,
  pm.project_id,
  pm.user_id,
  pm.member_role,
  pm.joined_at
`;

const MEMBER_WITH_USER_SELECT = `
  ${MEMBER_SELECT},
  u.full_name,
  u.email,
  u.is_active
`;

const JOIN_USERS = `
  JOIN users u ON u.user_id = pm.user_id
`;

const listMembers = async (projectId) => {
  const result = await query(
    `SELECT ${MEMBER_WITH_USER_SELECT}
     FROM project_members pm
     ${JOIN_USERS}
     WHERE pm.project_id = $1
     ORDER BY pm.joined_at ASC, pm.project_member_id ASC`,
    [projectId]
  );

  return result.rows;
};

const findMember = async (projectId, userId) => {
  const result = await query(
    `SELECT ${MEMBER_WITH_USER_SELECT}
     FROM project_members pm
     ${JOIN_USERS}
     WHERE pm.project_id = $1
       AND pm.user_id = $2`,
    [projectId, userId]
  );

  return result.rows[0] || null;
};

const memberExists = async (projectId, userId) => {
  const result = await query(
    "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );

  return result.rowCount > 0;
};

const addMember = async ({ projectId, userId, memberRole }) => {
  await query(
    `INSERT INTO project_members (project_id, user_id, member_role)
     VALUES ($1, $2, $3)`,
    [projectId, userId, memberRole]
  );

  return findMember(projectId, userId);
};

const updateMemberRole = async ({ projectId, userId, memberRole }) => {
  await query(
    `UPDATE project_members
     SET member_role = $3
     WHERE project_id = $1
       AND user_id = $2`,
    [projectId, userId, memberRole]
  );

  return findMember(projectId, userId);
};

const removeMember = async (projectId, userId) => {
  const result = await query(
    "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );

  return result.rowCount > 0;
};

module.exports = {
  listMembers,
  findMember,
  memberExists,
  addMember,
  updateMemberRole,
  removeMember,
};
