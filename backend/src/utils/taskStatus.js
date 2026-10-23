const ALLOWED_STATUSES = Object.freeze([
  "backlog",
  "to_do",
  "in_progress",
  "review",
  "done",
  "cancelled",
]);

const ALLOWED_URGENCY_PRIORITIES = Object.freeze([
  "important_urgent",
  "important_not_urgent",
  "not_important_urgent",
  "not_important_not_urgent",
]);

const ALLOWED_AGILE_IMPORTANCE = Object.freeze([
  "critical",
  "high",
  "medium",
  "low",
]);

const STATUS_TRANSITIONS = Object.freeze({
  backlog: ["to_do", "cancelled"],
  to_do: ["backlog", "in_progress", "cancelled"],
  in_progress: ["to_do", "review", "cancelled"],
  review: ["to_do", "in_progress", "done", "cancelled"],
  done: ["in_progress", "backlog"],
  cancelled: ["to_do", "backlog"],
});

const DEFAULTS = Object.freeze({
  status: "backlog",
  urgency_priority: "important_not_urgent",
  agile_importance: "medium",
  actual_minutes: 0,
  progress_percentage: 0,
});

const isAllowedStatus = (status) => ALLOWED_STATUSES.includes(status);

const isAllowedUrgencyPriority = (value) =>
  ALLOWED_URGENCY_PRIORITIES.includes(value);

const isAllowedAgileImportance = (value) =>
  ALLOWED_AGILE_IMPORTANCE.includes(value);

const isAllowedTransition = (from, to) =>
  isAllowedStatus(from) &&
  isAllowedStatus(to) &&
  STATUS_TRANSITIONS[from].includes(to);

module.exports = {
  ALLOWED_STATUSES,
  ALLOWED_URGENCY_PRIORITIES,
  ALLOWED_AGILE_IMPORTANCE,
  STATUS_TRANSITIONS,
  DEFAULTS,
  isAllowedStatus,
  isAllowedUrgencyPriority,
  isAllowedAgileImportance,
  isAllowedTransition,
};
