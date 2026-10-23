const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { AppError } = require("../utils/errors");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const UPLOAD_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "uploads",
  "task-attachments"
);

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
]);

const SAFE_EXT_PATTERN = /^[a-zA-Z0-9]{1,10}$/;

const sanitizeExtension = (originalName) => {
  const base = path.basename(originalName || "");
  const dotIndex = base.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === base.length - 1) {
    return "";
  }

  const ext = base.slice(dotIndex + 1);

  return SAFE_EXT_PATTERN.test(ext) ? ext.toLowerCase() : "";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(UPLOAD_DIR, { recursive: true }, (err) => {
      if (err) {
        return cb(
          new AppError(
            "Upload storage is unavailable",
            500,
            "UPLOAD_ERROR"
          )
        );
      }

      cb(null, UPLOAD_DIR);
    });
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString("hex");
    const ext = sanitizeExtension(file.originalname);
    const storedName = ext
      ? `${timestamp}-${randomBytes}.${ext}`
      : `${timestamp}-${randomBytes}`;

    cb(null, storedName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new AppError(
          "Unsupported file type",
          422,
          "UNSUPPORTED_FILE_TYPE"
        )
      );
    }

    cb(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof AppError) {
      return next(err);
    }

    if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError("File is too large", 413, "FILE_TOO_LARGE")
      );
    }

    return next(
      new AppError("Upload failed", 500, "UPLOAD_ERROR")
    );
  });
};

module.exports = {
  handleUpload,
  UPLOAD_DIR,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
