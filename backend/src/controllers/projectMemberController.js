const projectMemberService = require("../services/projectMemberService");
const asyncHandler = require("../utils/asyncHandler");

const listMembers = asyncHandler(async (req, res) => {
  const members = await projectMemberService.listMembers({
    user: req.user,
    projectId: req.params.projectId,
  });

  res.status(200).json({
    success: true,
    data: { members },
  });
});

const addMember = asyncHandler(async (req, res) => {
  const member = await projectMemberService.addMember({
    user: req.user,
    projectId: req.params.projectId,
    userId: req.body.user_id,
    memberRole: req.body.member_role,
  });

  res.status(201).json({
    success: true,
    data: { member },
  });
});

const updateMember = asyncHandler(async (req, res) => {
  const member = await projectMemberService.updateMember({
    user: req.user,
    projectId: req.params.projectId,
    userId: req.params.userId,
    memberRole: req.body.member_role,
  });

  res.status(200).json({
    success: true,
    data: { member },
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const result = await projectMemberService.removeMember({
    user: req.user,
    projectId: req.params.projectId,
    userId: req.params.userId,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  listMembers,
  addMember,
  updateMember,
  removeMember,
};
