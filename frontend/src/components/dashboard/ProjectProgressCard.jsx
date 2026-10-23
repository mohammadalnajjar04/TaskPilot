export function ProgressBar({ value = 0, label = "Progress", tone = "primary" }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));

  const barTones = {
    primary: "bg-primary-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    gray: "bg-gray-400",
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
    >
      <div
        className={`h-full rounded-full transition-all ${
          barTones[tone] || barTones.primary
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

const PROJECT_STATUS = {
  planning: { label: "Planning", classes: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In progress", classes: "bg-blue-100 text-blue-700" },
  on_hold: { label: "On hold", classes: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", classes: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-500" },
};

const barToneForStatus = {
  completed: "emerald",
  on_hold: "amber",
  cancelled: "gray",
};

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return String(Math.round(num * 100) / 100);
}

export function ProjectProgressCard({ project }) {
  const {
    project_id,
    project_key,
    project_name,
    status,
    progress_percentage,
    total_tasks,
    completed_tasks,
    overdue_tasks,
    task_completion_rate,
  } = project;

  const statusMeta = PROJECT_STATUS[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-600",
  };
  const barTone = barToneForStatus[status] || "primary";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary-700">
            {project_key}
          </span>
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {project_name}
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.classes}`}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <ProgressBar
          value={progress_percentage}
          label={`${project_name} progress`}
          tone={barTone}
        />
        <span className="shrink-0 text-sm font-semibold text-gray-900">
          {formatPercent(progress_percentage)}%
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>{total_tasks} tasks</span>
        <span className="text-emerald-600">{completed_tasks} done</span>
        <span className={overdue_tasks > 0 ? "font-medium text-red-600" : ""}>
          {overdue_tasks} overdue
        </span>
        <span>{formatPercent(task_completion_rate)}% completion</span>
      </div>
    </div>
  );
}
