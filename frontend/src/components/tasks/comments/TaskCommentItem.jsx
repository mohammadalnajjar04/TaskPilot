import { Loader2, Pencil, Trash2 } from "lucide-react";

import { TaskCommentForm } from "./TaskCommentForm";

function getInitials(fullName, email) {
  const source = (fullName || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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

function isEdited(comment) {
  return Boolean(comment.updated_at) && String(comment.updated_at) !== String(comment.created_at);
}

export function TaskCommentItem({
  comment,
  isEditable = false,
  isDeletable = false,
  isEditing = false,
  isSaving = false,
  isDeleting = false,
  onStartEdit = () => {},
  onCancelEdit = () => {},
  onUpdate = () => {},
  onDelete = () => {},
}) {
  const displayName = comment.full_name || comment.email || `User ${comment.user_id}`;
  const edited = isEdited(comment);

  return (
    <article className="flex items-start gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700"
        aria-hidden="true"
      >
        {getInitials(comment.full_name, comment.email)}
      </span>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-gray-900">{displayName}</span>
          {comment.email && (
            <span className="truncate text-xs text-gray-500">{comment.email}</span>
          )}
        </header>

        <p className="mt-0.5 text-xs text-gray-500">
          {formatDateTime(comment.created_at)}
          {edited && <span className="ml-1.5 text-gray-400">Edited</span>}
        </p>

        {isEditing ? (
          <div className="mt-3">
            <TaskCommentForm
              id={`comment-edit-${comment.comment_id}`}
              label="Edit comment"
              initialText={comment.comment_text}
              submitLabel="Save"
              isSubmitting={isSaving}
              onSubmit={onUpdate}
              onCancel={onCancelEdit}
            />
          </div>
        ) : (
          <>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-900">
              {comment.comment_text}
            </p>

            {(isEditable || isDeletable) && (
              <div className="mt-2 flex items-center gap-1">
                {isEditable && (
                  <button
                    type="button"
                    onClick={onStartEdit}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                  </button>
                )}
                {isDeletable && (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
