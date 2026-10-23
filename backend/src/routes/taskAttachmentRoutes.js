const express = require("express");

const taskAttachmentController = require("../controllers/taskAttachmentController");
const taskAttachmentValidator = require("../validators/taskAttachmentValidator");
const validateRequest = require("../middleware/validateRequest");
const { handleUpload } = require("../middleware/uploadTaskAttachment");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get(
  "/",
  taskAttachmentValidator.listAttachmentsValidator,
  validateRequest,
  taskAttachmentController.listAttachments
);

router.get(
  "/:attachmentId",
  taskAttachmentValidator.getAttachmentValidator,
  validateRequest,
  taskAttachmentController.getAttachment
);

router.post(
  "/",
  taskAttachmentValidator.uploadAttachmentValidator,
  validateRequest,
  handleUpload,
  taskAttachmentController.uploadAttachment
);

router.delete(
  "/:attachmentId",
  taskAttachmentValidator.deleteAttachmentValidator,
  validateRequest,
  taskAttachmentController.deleteAttachment
);

module.exports = router;
