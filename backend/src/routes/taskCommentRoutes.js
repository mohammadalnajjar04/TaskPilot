const express = require("express");

const taskCommentController = require("../controllers/taskCommentController");
const taskCommentValidator = require("../validators/taskCommentValidator");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get(
  "/",
  taskCommentValidator.listCommentsValidator,
  validateRequest,
  taskCommentController.listComments
);

router.post(
  "/",
  taskCommentValidator.createCommentValidator,
  validateRequest,
  taskCommentController.createComment
);

router.put(
  "/:commentId",
  taskCommentValidator.updateCommentValidator,
  validateRequest,
  taskCommentController.updateComment
);

router.delete(
  "/:commentId",
  taskCommentValidator.deleteCommentValidator,
  validateRequest,
  taskCommentController.deleteComment
);

module.exports = router;
