const { param } = require("express-validator");

const taskIdValidator = [
  param("taskId")
    .isInt({ min: 1 })
    .withMessage("Task id must be a positive integer"),
];

const attachmentIdValidator = [
  param("attachmentId")
    .isInt({ min: 1 })
    .withMessage("Attachment id must be a positive integer"),
];

const listAttachmentsValidator = [...taskIdValidator];

const getAttachmentValidator = [...taskIdValidator, ...attachmentIdValidator];

const uploadAttachmentValidator = [...taskIdValidator];

const deleteAttachmentValidator = [...taskIdValidator, ...attachmentIdValidator];

module.exports = {
  taskIdValidator,
  attachmentIdValidator,
  listAttachmentsValidator,
  getAttachmentValidator,
  uploadAttachmentValidator,
  deleteAttachmentValidator,
};
