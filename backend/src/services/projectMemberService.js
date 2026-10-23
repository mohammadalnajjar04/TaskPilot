const projectRepository = require("../repositories/projectRepository");
const projectMemberRepository = require("../repositories/projectMemberRepository");
const userRepository = require("../repositories/userRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const {
  AppError,
  ForbiddenError,
  ConflictError,
} = require("../utils/errors");

const PROJECT_NOT_FOUND_CODE = "PROJECT_NOT_FOUND";
const USER_NOT_FOUND_CODE = "USER_NOT_FOUND";
const PROJECT_MEMBER_NOT_FOUND_CODE = "PROJECT_MEMBER_NOT_FOUND";
const PROJECT_MEMBER_ALREADY_EXISTS_CODE = "PROJECT_MEMBER_ALREADY_EXISTS";
const INVALID_MEMBER_ROLE_CODE = "INVALID_MEMBER_ROLE";
const CANNOT_MODIFY_OWNER_CODE = "CANNOT_MODIFY_OWNER";
const USER_NOT_ACTIVE_CODE = "USER_NOT_ACTIVE";

const PROJECT_MEMBER_ROLES = Object.freeze(["owner", "manager", "member", "viewer"]);

const ASSIGNABLE_MEMBER_ROLES = Object.freeze(["manager", "member", "viewer"]);

const isAdmin = (user) => user.role === "admin";

const getUserRoleInProject = async (project, user) => {
  if (Number(project.owner_id) === Number(user.user_id)) {
    return "owner";
  }

  const member = await projectMemberRepository.findMember(
    project.project_id,
    user.user_id
  );

  return member ? member.member_role : null;
};

const getProjectOrThrow = async (projectId) => {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404, PROJECT_NOT_FOUND_CODE);
  }

  return project;
};

const assertCanList = (isAdminUser, role) => {
  if (!isAdminUser && role === null) {
    throw new ForbiddenError(
      "You do not have permission to view members of this project"
    );
  }
};

const assertCanManage = (isAdminUser, role) => {
  if (!isAdminUser && role !== "owner") {
    throw new ForbiddenError(
      "You do not have permission to manage members of this project"
    );
  }
};

const assertValidAssignableRole = (memberRole) => {
  if (!ASSIGNABLE_MEMBER_ROLES.includes(memberRole)) {
    throw new AppError("Invalid member role", 422, INVALID_MEMBER_ROLE_CODE);
  }
};

const assertTargetUserValid = async (userId) => {
  const targetUser = await userRepository.findById(userId);

  if (!targetUser) {
    throw new AppError("User not found", 404, USER_NOT_FOUND_CODE);
  }

  if (!targetUser.is_active) {
    throw new AppError("User is not active", 422, USER_NOT_ACTIVE_CODE);
  }

  return targetUser;
};

const listMembers = async ({ user, projectId }) => {
  const project = await getProjectOrThrow(projectId);

  const role = await getUserRoleInProject(project, user);

  assertCanList(isAdmin(user), role);

  return projectMemberRepository.listMembers(projectId);
};

const addMember = async ({ user, projectId, userId, memberRole }) => {
  const project = await getProjectOrThrow(projectId);

  const role = await getUserRoleInProject(project, user);

  assertCanManage(isAdmin(user), role);

  assertValidAssignableRole(memberRole);

  const targetUser = await assertTargetUserValid(userId);

  if (Number(project.owner_id) === Number(userId)) {
    throw new ConflictError(
      "User is already a member",
      PROJECT_MEMBER_ALREADY_EXISTS_CODE
    );
  }

  const alreadyMember = await projectMemberRepository.memberExists(
    projectId,
    userId
  );

  if (alreadyMember) {
    throw new ConflictError(
      "User is already a member",
      PROJECT_MEMBER_ALREADY_EXISTS_CODE
    );
  }

  const member = await projectMemberRepository.addMember({
    projectId,
    userId,
    memberRole,
  });

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "PROJECT_MEMBER_ADDED",
    description: `Member added: ${targetUser.email} as ${memberRole}`,
    projectId,
  });

  return member;
};

const updateMember = async ({ user, projectId, userId, memberRole }) => {
  const project = await getProjectOrThrow(projectId);

  const role = await getUserRoleInProject(project, user);

  assertCanManage(isAdmin(user), role);

  assertValidAssignableRole(memberRole);

  if (Number(project.owner_id) === Number(userId)) {
    throw new AppError(
      "The project owner cannot be modified",
      422,
      CANNOT_MODIFY_OWNER_CODE
    );
  }

  const existing = await projectMemberRepository.findMember(projectId, userId);

  if (!existing) {
    throw new AppError(
      "Project member not found",
      404,
      PROJECT_MEMBER_NOT_FOUND_CODE
    );
  }

  const member = await projectMemberRepository.updateMemberRole({
    projectId,
    userId,
    memberRole,
  });

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "PROJECT_MEMBER_ROLE_UPDATED",
    description: `Member role updated: ${existing.email} to ${memberRole}`,
    projectId,
  });

  return member;
};

const removeMember = async ({ user, projectId, userId }) => {
  const project = await getProjectOrThrow(projectId);

  const role = await getUserRoleInProject(project, user);

  assertCanManage(isAdmin(user), role);

  if (Number(project.owner_id) === Number(userId)) {
    throw new AppError(
      "The project owner cannot be removed",
      422,
      CANNOT_MODIFY_OWNER_CODE
    );
  }

  const existing = await projectMemberRepository.findMember(projectId, userId);

  if (!existing) {
    throw new AppError(
      "Project member not found",
      404,
      PROJECT_MEMBER_NOT_FOUND_CODE
    );
  }

  await projectMemberRepository.removeMember(projectId, userId);

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "PROJECT_MEMBER_REMOVED",
    description: `Member removed: ${existing.email}`,
    projectId,
  });

  return { project_id: Number(projectId), user_id: Number(userId) };
};

module.exports = {
  PROJECT_MEMBER_ROLES,
  ASSIGNABLE_MEMBER_ROLES,
  listMembers,
  addMember,
  updateMember,
  removeMember,
};
