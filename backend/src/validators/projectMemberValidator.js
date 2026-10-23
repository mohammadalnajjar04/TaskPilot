const { body, param } = require("express-validator");

const projectIdParam = param("projectId")
  .isInt({ min: 1 })
  .withMessage("Project id must be a positive integer");

const userIdParam = param("userId")
  .isInt({ min: 1 })
  .withMessage("User id must be a positive integer");

const userIdBody = body("user_id")
  .isInt({ min: 1 })
  .withMessage("User id must be a positive integer");

const memberRoleBody = body("member_role")
  .isString()
  .withMessage("Member role must be a string")
  .trim()
  .notEmpty()
  .withMessage("Member role is required");

const listMembersValidator = [projectIdParam];

const addMemberValidator = [projectIdParam, userIdBody, memberRoleBody];

const updateMemberValidator = [projectIdParam, userIdParam, memberRoleBody];

const removeMemberValidator = [projectIdParam, userIdParam];

module.exports = {
  listMembersValidator,
  addMemberValidator,
  updateMemberValidator,
  removeMemberValidator,
};
