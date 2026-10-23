import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "../ui/Button";
import { TaskStatusBadge } from "./TaskStatusBadge";
import {
  TaskImportanceBadge,
  TaskPriorityBadge,
} from "./TaskPriorityBadge";

const backLinkClasses =
  "inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

const dangerButtonClasses =
  "inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function LinkToTasks() {
  return (
    <Link to="/tasks" className={backLinkClasses}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to tasks
    </Link>
  );
}

export function TaskDetailsHeader({ task, canDelete, isDeleting, onDelete }) {
  const navigate = useNavigate();

  return (
    <header className="space-y-6">
      <LinkToTasks />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {task.project_key && (
              <span className="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary-700">
                {task.project_key}
              </span>
            )}
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge urgency={task.urgency_priority} />
            <TaskImportanceBadge importance={task.agile_importance} />
          </div>
          <h1 className="break-words text-2xl font-semibold tracking-tight text-gray-900">
            {task.title}
          </h1>
          {task.project_name && (
            <p className="text-sm text-gray-500">{task.project_name}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/tasks/${task.task_id}/edit`)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className={dangerButtonClasses}
            >
              {isDeleting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
