import { User } from "lucide-react";

import { ProgressBar } from "./ProjectProgressCard";

const TASK_STATUS = {
  backlog: { label: "Backlog", classes: "bg-gray-100 text-gray-600" },
  to_do: { label: "To do", classes: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In progress", classes: "bg-indigo-100 text-indigo-700" },
  review: { label: "In review", classes: "bg-purple-100 text-purple-700" },
  done: { label: "Done", classes: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-500" },
};

const URGENCY_LABELS = {
  important_urgent: { label: "Important · Urgent", classes: "bg-red-100 text-red-700" },
  important_not_urgent: { label: "Important", classes: "bg-amber-100 text-amber-700" },
  not_important_urgent: { label: "Urgent", classes: "bg-orange-100 text-orange-700" },
};

const IMPORTANCE_LABELS = {
  critical: { label: "Critical", classes: "bg-red-100 text-red-700" },
  high: { label: "High", classes: "bg-orange-100 text-orange-700" },
};

function formatDate(value) {
  if (!value) return "";
  const [y, m, d] = String(value).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDueBadge(dateString) {
  if (!dateString) return null;
  const [y, m, d] = String(dateString).split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / 86400000);

  if (diffDays < 0) {
    return { label: "Overdue", classes: "bg-red-100 text-red-700" };
  }
  if (diffDays === 0) {
    return { label: "Due today", classes: "bg-amber-100 text-amber-800" };
  }
  if (diffDays === 1) {
    return { label: "Due tomorrow", classes: "bg-indigo-100 text-indigo-700" };
  }
  return { label: `Due ${formatDate(dateString)}`, classes: "bg-gray-100 text-gray-600" };
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return String(Math.round(num * 100) / 100);
}

export function UpcomingTaskItem({ task }) {
  const {
    title,
    project_key,
    project_name,
    due_date,
    status,
    agile_importance,
    urgency_priority,
    progress_percentage,
    assigned_to_name,
  } = task;

  const statusMeta = TASK_STATUS[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-600",
  };
  const importanceMeta = IMPORTANCE_LABELS[agile_importance];
  const urgencyMeta = URGENCY_LABELS[urgency_priority];
  const dueBadge = getDueBadge(due_date);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {dueBadge && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dueBadge.classes}`}
            >
              {dueBadge.label}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.classes}`}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      <p className="mt-1 truncate text-xs text-gray-500">
        {project_key} · {project_name}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <ProgressBar value={progress_percentage} label={`${title} progress`} />
        <span className="shrink-0 text-sm font-semibold text-gray-900">
          {formatPercent(progress_percentage)}%
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {importanceMeta && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${importanceMeta.classes}`}
          >
            {importanceMeta.label}
          </span>
        )}
        {urgencyMeta && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${urgencyMeta.classes}`}
          >
            {urgencyMeta.label}
          </span>
        )}
        {assigned_to_name && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            {assigned_to_name}
          </span>
        )}
      </div>
    </div>
  );
}
