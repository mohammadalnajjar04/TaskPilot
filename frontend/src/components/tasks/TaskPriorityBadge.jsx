const URGENCY_PRIORITY = {
  important_urgent: {
    label: "Important & urgent",
    classes: "bg-red-100 text-red-700",
  },
  important_not_urgent: {
    label: "Important",
    classes: "bg-orange-100 text-orange-700",
  },
  not_important_urgent: {
    label: "Urgent",
    classes: "bg-amber-100 text-amber-800",
  },
  not_important_not_urgent: {
    label: "Normal",
    classes: "bg-gray-100 text-gray-600",
  },
};

const AGILE_IMPORTANCE = {
  critical: { label: "Critical", classes: "bg-red-100 text-red-700" },
  high: { label: "High", classes: "bg-orange-100 text-orange-700" },
  medium: { label: "Medium", classes: "bg-blue-100 text-blue-700" },
  low: { label: "Low", classes: "bg-gray-100 text-gray-600" },
};

export const TASK_URGENCY_OPTIONS = Object.entries(URGENCY_PRIORITY).map(
  ([value, { label }]) => ({ value, label })
);

export const TASK_IMPORTANCE_OPTIONS = Object.entries(AGILE_IMPORTANCE).map(
  ([value, { label }]) => ({ value, label })
);

export function TaskPriorityBadge({ urgency }) {
  const meta = URGENCY_PRIORITY[urgency] || {
    label: urgency || "Unknown",
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

export function TaskImportanceBadge({ importance }) {
  const meta = AGILE_IMPORTANCE[importance] || {
    label: importance || "Unknown",
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
