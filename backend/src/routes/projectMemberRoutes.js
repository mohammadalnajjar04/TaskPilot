const express = require("express");

const projectMemberController = require("../controllers/projectMemberController");
const projectMemberValidator = require("../validators/projectMemberValidator");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get(
  "/",
  projectMemberValidator.listMembersValidator,
  validateRequest,
  projectMemberController.listMembers
);

router.post(
  "/",
  projectMemberValidator.addMemberValidator,
  validateRequest,
  projectMemberController.addMember
);

router.patch(
  "/:userId",
  projectMemberValidator.updateMemberValidator,
  validateRequest,
  projectMemberController.updateMember
);

router.delete(
  "/:userId",
  projectMemberValidator.removeMemberValidator,
  validateRequest,
  projectMemberController.removeMember
);

module.exports = router;
