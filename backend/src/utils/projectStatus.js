const ALLOWED_STATUSES = Object.freeze([
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
]);

const STATUS_TRANSITIONS = Object.freeze({
  planning: ["in_progress", "cancelled"],
  in_progress: ["on_hold", "completed", "cancelled"],
  on_hold: ["in_progress", "cancelled"],
  completed: ["in_progress"],
  cancelled: ["in_progress"],
});

const isAllowedStatus = (status) => ALLOWED_STATUSES.includes(status);

const isAllowedTransition = (from, to) =>
  isAllowedStatus(from) && STATUS_TRANSITIONS[from].includes(to);

module.exports = {
  ALLOWED_STATUSES,
  STATUS_TRANSITIONS,
  isAllowedStatus,
  isAllowedTransition,
};
