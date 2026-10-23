import { Loader2 } from "lucide-react";

import { TaskStatusBadge } from "./TaskStatusBadge";

const TASK_STATUS_TRANSITIONS = {
  backlog: ["to_do", "cancelled"],
  to_do: ["backlog", "in_progress", "cancelled"],
  in_progress: ["to_do", "review", "cancelled"],
  review: ["to_do", "in_progress", "done", "cancelled"],
  done: ["in_progress", "backlog"],
  cancelled: ["to_do", "backlog"],
};

const STATUS_LABELS = {
  backlog: "Backlog",
  to_do: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
  cancelled: "Cancelled",
};

const statusButtonClasses = {
  backlog:
    "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
  to_do: "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100",
  in_progress:
    "border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  review: "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100",
  done: "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  cancelled:
    "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100",
};

export function TaskStatusActions({ task, isChanging = false, onChangeStatus }) {
  const nextStatuses = TASK_STATUS_TRANSITIONS[task.status] ?? [];

  return (
    <section
      aria-labelledby="task-status-actions-heading"
      className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="task-status-actions-heading"
        className="text-lg font-semibold tracking-tight text-gray-900"
      >
        Update status
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Current
        </span>
        <TaskStatusBadge status={task.status} />
      </div>

      <p className="mt-5 text-sm text-gray-500">Move task to:</p>

      <div className="mt-3 flex flex-col gap-2">
        {nextStatuses.length > 0 ? (
          nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isChanging}
              onClick={() => onChangeStatus(status)}
              aria-label={`Move task to ${STATUS_LABELS[status] || status}`}
              className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                statusButtonClasses[status] || statusButtonClasses.backlog
              }`}
            >
              {STATUS_LABELS[status] || status}
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No status changes available for this task.
          </p>
        )}
      </div>

      {isChanging && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Updating status...
        </p>
      )}
    </section>
  );
}
