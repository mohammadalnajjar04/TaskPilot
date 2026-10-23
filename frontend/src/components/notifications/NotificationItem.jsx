import { Link } from "react-router-dom";
import { Check, Loader2, Trash2 } from "lucide-react";

import { getNotificationTypeMeta, NotificationTypeIcon } from "./NotificationTypeIcon";

function formatRelative(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return String(createdAt);
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

export function NotificationItem({
  notification,
  isMarking = false,
  isDeleting = false,
  onMarkAsRead = () => {},
  onDelete = () => {},
}) {
  const unread = !notification.is_read;
  const typeMeta = getNotificationTypeMeta(notification.notification_type);

  return (
    <article
      className={`rounded-xl border p-4 ${
        unread
          ? "border-primary-200 bg-primary-50/40"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <NotificationTypeIcon type={notification.notification_type} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 break-words text-sm font-semibold text-gray-900">
              {notification.title}
            </p>
            {unread && (
              <span className="shrink-0 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                New
              </span>
            )}
          </div>

          {notification.message && (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-600">
              {notification.message}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
            <span>{typeMeta.label}</span>
            <span aria-hidden="true">·</span>
            <time
              dateTime={notification.created_at}
              title={formatFullDateTime(notification.created_at)}
            >
              {formatRelative(notification.created_at)}
            </time>
            {unread && <span className="sr-only">Unread</span>}
          </div>

          {(notification.task_id || notification.project_id) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {notification.task_id != null && (
                <Link
                  to={`/tasks/${notification.task_id}`}
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
                >
                  View task
                </Link>
              )}
              {notification.project_id != null && (
                <Link
                  to={`/projects/${notification.project_id}`}
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
                >
                  View project
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {unread && (
            <button
              type="button"
              onClick={onMarkAsRead}
              disabled={isMarking || isDeleting}
              aria-label={`Mark "${notification.title}" as read`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMarking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{isMarking ? "Marking..." : "Mark read"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting || isMarking}
            aria-label={`Delete notification "${notification.title}"`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
