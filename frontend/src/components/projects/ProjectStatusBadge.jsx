const PROJECT_STATUS = {
  planning: { label: "Planning", classes: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In progress", classes: "bg-blue-100 text-blue-700" },
  on_hold: { label: "On hold", classes: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", classes: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-500" },
};

export const PROJECT_STATUS_OPTIONS = Object.entries(PROJECT_STATUS).map(
  ([value, { label }]) => ({ value, label })
);

export function ProjectStatusBadge({ status }) {
  const meta = PROJECT_STATUS[status] || {
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
