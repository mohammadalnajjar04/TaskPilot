const TASK_STATUS = {
  backlog: { label: "Backlog", classes: "bg-gray-100 text-gray-600" },
  to_do: { label: "To do", classes: "bg-blue-100 text-blue-700" },
  in_progress: {
    label: "In progress",
    classes: "bg-indigo-100 text-indigo-700",
  },
  review: { label: "Review", classes: "bg-amber-100 text-amber-700" },
  done: { label: "Done", classes: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-500" },
};

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS).map(
  ([value, { label }]) => ({ value, label })
);

export function TaskStatusBadge({ status }) {
  const meta = TASK_STATUS[status] || {
    label: status || "Unknown",
    classes: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.classes}`}
    >
      {meta.label}
    </span>
  );
}
