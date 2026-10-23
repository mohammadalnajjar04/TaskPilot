import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  FileText,
  FolderKanban,
  ListTodo,
  MessageSquare,
  Paperclip,
  Pencil,
  User,
} from "lucide-react";

import { ProgressBar } from "../dashboard/ProjectProgressCard";
import { TaskStatusBadge } from "./TaskStatusBadge";
import {
  TaskImportanceBadge,
  TaskPriorityBadge,
} from "./TaskPriorityBadge";

function formatDate(value) {
  if (!value) return "Not set";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "Not set";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMinutes(value) {
  if (value === null || value === undefined || value === "") return "Not set";
  const total = Number(value);
  if (!Number.isFinite(total) || total < 0) return "Not set";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function DetailRow({ label, children }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm text-gray-900">{children}</dd>
    </div>
  );
}

const relatedLinkClasses =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

export function TaskOverviewCard({ task }) {
  const {
    task_id,
    project_id,
    project_key,
    project_name,
    category_name,
    created_by_name,
    assigned_to_name,
    parent_task_id,
    parent_task_title,
    title,
    description,
    status,
    urgency_priority,
    agile_importance,
    start_date,
    due_date,
    estimated_minutes,
    actual_minutes,
    progress_percentage,
    completed_at,
    created_at,
    updated_at,
  } = task;

  return (
    <section
      aria-labelledby="task-information-heading"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="task-information-heading"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900"
      >
        <FileText className="h-5 w-5 text-primary-500" aria-hidden="true" />
        Task information
      </h2>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Description
        </p>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-gray-900">
          {description?.trim() || "No description provided."}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <DetailRow label="Task ID">
          <span className="font-mono text-sm">{task_id}</span>
        </DetailRow>

        <DetailRow label="Project">
          {project_id != null ? (
            <Link
              to={`/projects/${project_id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline"
            >
              <FolderKanban
                className="h-4 w-4 shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {project_name || `Project ${project_id}`}
              {project_key ? ` (${project_key})` : ""}
            </Link>
          ) : (
            <span>Not set</span>
          )}
        </DetailRow>

        <DetailRow label="Category">
          <span className="inline-flex items-center gap-1.5">
            {category_name || "No category"}
          </span>
        </DetailRow>

        <DetailRow label="Assignee">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {assigned_to_name || "Unassigned"}
          </span>
        </DetailRow>

        <DetailRow label="Created by">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {created_by_name || "Unknown"}
          </span>
        </DetailRow>

        <DetailRow label="Parent task">
          {parent_task_id != null ? (
            <Link
              to={`/tasks/${parent_task_id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline"
            >
              <ListTodo className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              {parent_task_title || `Task ${parent_task_id}`}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <ListTodo className="h-4 w-4 text-gray-400" aria-hidden="true" />
              No parent task
            </span>
          )}
        </DetailRow>

        <DetailRow label="Status">
          <TaskStatusBadge status={status} />
        </DetailRow>

        <DetailRow label="Priority">
          <TaskPriorityBadge urgency={urgency_priority} />
        </DetailRow>

        <DetailRow label="Importance">
          <TaskImportanceBadge importance={agile_importance} />
        </DetailRow>

        <DetailRow label="Start date">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDate(start_date)}
          </span>
        </DetailRow>

        <DetailRow label="Due date">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDate(due_date)}
          </span>
        </DetailRow>

        <DetailRow label="Estimated time">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatMinutes(estimated_minutes)}
          </span>
        </DetailRow>

        <DetailRow label="Actual time">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatMinutes(actual_minutes)}
          </span>
        </DetailRow>

        <DetailRow label="Progress">
          <div className="flex items-center gap-3">
            <ProgressBar
              value={progress_percentage}
              label={`${title ?? "Task"} progress`}
            />
            <span className="shrink-0 text-sm font-semibold text-gray-900">
              {progress_percentage}%
            </span>
          </div>
        </DetailRow>

        <DetailRow label="Completed at">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDateTime(completed_at)}
          </span>
        </DetailRow>

        <DetailRow label="Created at">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDateTime(created_at)}
          </span>
        </DetailRow>

        <DetailRow label="Last updated">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDateTime(updated_at)}
          </span>
        </DetailRow>
      </dl>

      <div className="mt-6 border-t border-gray-100 pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Related
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {project_id != null && (
            <Link to={`/projects/${project_id}`} className={relatedLinkClasses}>
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              Project
            </Link>
          )}
          {parent_task_id != null && (
            <Link to={`/tasks/${parent_task_id}`} className={relatedLinkClasses}>
              <ListTodo className="h-4 w-4" aria-hidden="true" />
              Parent task
            </Link>
          )}
          <Link to={`/tasks/${task_id}/edit`} className={relatedLinkClasses}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit task
          </Link>
          <a href="#comments" className={relatedLinkClasses}>
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Comments
          </a>
          <a href="#attachments" className={relatedLinkClasses}>
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            Attachments
          </a>
        </div>
      </div>
    </section>
  );
}
