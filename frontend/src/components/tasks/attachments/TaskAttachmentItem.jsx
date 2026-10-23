import {
  ExternalLink,
  File,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";

import { resolveBackendUrl } from "../../../utils/url";

function getFileTypeIcon(mimeType) {
  if (mimeType?.startsWith("image/")) {
    return FileImage;
  }
  if (mimeType === "application/pdf" || mimeType === "text/plain") {
    return FileText;
  }
  if (mimeType === "application/zip") {
    return FileArchive;
  }
  return File;
}

function getExtension(fileName) {
  const dotIndex = (fileName || "").lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === (fileName || "").length - 1) {
    return "FILE";
  }
  return fileName.slice(dotIndex + 1).toUpperCase();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) {
    return `${value} ${units[unitIndex]}`;
  }

  return `${value.toFixed(1).replace(/\.0$/, "")} ${units[unitIndex]}`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TaskAttachmentItem({
  attachment,
  canDelete = false,
  isDeleting = false,
  onDelete = () => {},
}) {
  const Icon = getFileTypeIcon(attachment.mime_type);
  const extension = getExtension(attachment.file_name);
  const uploaderName =
    attachment.uploader_full_name || `User ${attachment.uploader_user_id ?? attachment.uploaded_by}`;
  const downloadHref = resolveBackendUrl(attachment.download_url);

  return (
    <article className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3.5 transition-colors hover:border-gray-200">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900">{attachment.file_name}</p>
          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {extension}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-gray-500">
          <span className="sr-only">File type: </span>
          {attachment.mime_type || "Unknown type"}
          {attachment.file_size != null ? ` · ${formatBytes(attachment.file_size)}` : ""}
        </p>

        <p className="mt-0.5 text-xs text-gray-500">
          Uploaded {formatDateTime(attachment.uploaded_at)} by {uploaderName}
          {attachment.uploader_email ? ` (${attachment.uploader_email})` : ""}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1">
        {downloadHref && (
          <a
            href={downloadHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Open
          </a>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={`Delete attachment ${attachment.file_name}`}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        )}
      </div>
    </article>
  );
}
