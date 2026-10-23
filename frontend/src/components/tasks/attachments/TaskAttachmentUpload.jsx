import { useState } from "react";
import { UploadCloud } from "lucide-react";

import { FormError } from "../../common/FormError";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPT_TEXT = "JPEG, PNG, WebP, PDF, TXT, ZIP";
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.pdf,.txt,.zip";

function validateFile(file) {
  if (!file) {
    return "Please choose a file to upload.";
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Unsupported file type. Accepted types: ${ACCEPT_TEXT}.`;
  }
  if (file.size <= 0) {
    return "The selected file is empty.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "The selected file is larger than 5 MB.";
  }
  return null;
}

export function TaskAttachmentUpload({ isUploading = false, onUpload = () => {} }) {
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError(null);

    if (!file) {
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const uploadError = await onUpload(file);
    if (uploadError) {
      setError(uploadError);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    if (isUploading) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const uploadError = await onUpload(file);
    if (uploadError) {
      setError(uploadError);
    }
  };

  return (
    <form noValidate className="space-y-3">
      {error && <FormError message={error} />}

      <label
        htmlFor="attachment-upload"
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isUploading
            ? "cursor-not-allowed border-gray-200 bg-gray-50"
            : "border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/50"
        }`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <UploadCloud className="h-6 w-6 text-gray-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-gray-700">
          {isUploading ? "Uploading..." : "Click to choose a file or drag and drop"}
        </span>
        <span className="text-xs text-gray-500">
          Accepted types: {ACCEPT_TEXT} &middot; Maximum size: 5 MB
        </span>
        <input
          id="attachment-upload"
          type="file"
          accept={ACCEPT_ATTR}
          disabled={isUploading}
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>
    </form>
  );
}
