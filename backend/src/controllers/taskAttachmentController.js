const fs = require("fs/promises");
const path = require("path");
const taskAttachmentService = require("../services/taskAttachmentService");
const { UPLOAD_DIR } = require("../middleware/uploadTaskAttachment");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");

const UPLOAD_DIR_PREFIX = UPLOAD_DIR + path.sep;

const toAttachmentResponse = (attachment) => {
  if (!attachment) {
    return attachment;
  }

  const { file_path: filePath, ...rest } = attachment;

  if (!filePath) {
    return rest;
  }

  const storedName = path.basename(filePath);

  return {
    ...rest,
    download_url: `/uploads/task-attachments/${encodeURIComponent(
      storedName
    )}`,
  };
};

const listAttachments = asyncHandler(async (req, res) => {
  const attachments = await taskAttachmentService.listAttachments(
    req.params.taskId,
    req.user
  );

  res.status(200).json({
    success: true,
    data: {
      attachments: attachments.map(toAttachmentResponse),
    },
  });
});

const getAttachment = asyncHandler(async (req, res) => {
  const attachment = await taskAttachmentService.getAttachment(
    req.params.taskId,
    req.params.attachmentId,
    req.user
  );

  res.status(200).json({
    success: true,
    data: {
      attachment: toAttachmentResponse(attachment),
    },
  });
});

const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(
      "A file is required",
      422,
      "FILE_REQUIRED"
    );
  }

  const attachment = await taskAttachmentService.createAttachment(
    req.params.taskId,
    req.user,
    {
      fileName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    }
  );

  res.status(201).json({
    success: true,
    data: {
      attachment: toAttachmentResponse(attachment),
    },
  });
});

const deleteAttachment = asyncHandler(async (req, res) => {
  const deleted = await taskAttachmentService.deleteAttachment(
    req.params.taskId,
    req.params.attachmentId,
    req.user
  );

  const storedPath = deleted && deleted.file_path;

  if (storedPath) {
    const resolved = path.resolve(storedPath);

    if (resolved.startsWith(UPLOAD_DIR_PREFIX)) {
      try {
        await fs.unlink(resolved);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.warn(
            `[task-attachments] failed to delete physical file: ${error.message}`
          );
        }
      }
    } else {
      console.warn(
        `[task-attachments] refusing to delete path outside upload dir: ${storedPath}`
      );
    }
  }

  res.status(200).json({
    success: true,
    data: {
      deleted: toAttachmentResponse(deleted),
    },
  });
});

module.exports = {
  listAttachments,
  getAttachment,
  uploadAttachment,
  deleteAttachment,
};
