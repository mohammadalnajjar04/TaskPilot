import { Link } from "react-router-dom";
import { CalendarDays, Eye, Pencil, User } from "lucide-react";

import { ProgressBar } from "../dashboard/ProjectProgressCard";
import { TaskStatusBadge } from "./TaskStatusBadge";
import {
  TaskImportanceBadge,
  TaskPriorityBadge,
} from "./TaskPriorityBadge";

const viewLinkClasses =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

const editLinkClasses =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

const chipClasses = {
  overdue: "inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700",
  dueToday:
    "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700",
};

function toDateKey(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TaskCard({ task }) {
  const {
    task_id,
    title,
    project_key,
    project_name,
    status,
    urgency_priority,
    agile_importance,
    start_date,
    due_date,
    progress_percentage,
    assigned_to_name,
    created_by_name,
    category_name,
  } = task;

  const isFinished = status === "done" || status === "cancelled";
  const dueDateKey = toDateKey(due_date);
  const isOverdue = !isFinished && dueDateKey !== null && dueDateKey < todayKey();
  const isDueToday =
    !isFinished && dueDateKey !== null && dueDateKey === todayKey();

  const startLabel = formatDate(start_date);
  const dueLabel = formatDate(due_date);
  const dueClass = isOverdue ? "font-semibold text-red-600" : "";

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {project_key && (
              <span className="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary-700">
                {project_key}
              </span>
            )}
            {category_name && (
              <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                {category_name}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 break-words text-sm font-semibold text-gray-900">
            {title}
          </h3>
          {project_name && (
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {project_name}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <TaskStatusBadge status={status} />
          {isOverdue && <span className={chipClasses.overdue}>Overdue</span>}
          {isDueToday && (
            <span className={chipClasses.dueToday}>Due today</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <TaskPriorityBadge urgency={urgency_priority} />
        <TaskImportanceBadge importance={agile_importance} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ProgressBar
          value={progress_percentage}
          label={`${title} progress`}
        />
        <span className="shrink-0 text-sm font-semibold text-gray-900">
          {progress_percentage}%
        </span>
      </div>

      {(startLabel || dueLabel) && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {startLabel && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              Start {startLabel}
            </span>
          )}
          {dueLabel && (
            <span
              className={`inline-flex items-center gap-1.5 ${dueClass}`}
            >
              <CalendarDays className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              Due {dueLabel}
            </span>
          )}
        </p>
      )}

      <div className="mt-3 space-y-1">
        {assigned_to_name && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
            Assigned to {assigned_to_name}
          </p>
        )}
        {created_by_name && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
            Created by {created_by_name}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4">
        <Link to={`/tasks/${task_id}`} className={viewLinkClasses}>
          <Eye className="h-4 w-4" aria-hidden="true" />
          View
        </Link>
        <Link to={`/tasks/${task_id}/edit`} className={editLinkClasses}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </Link>
      </div>
    </div>
  );
}
