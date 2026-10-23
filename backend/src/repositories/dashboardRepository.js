const { query } = require("../config/db");

const ACCESS_PROJECTS_USER = `
  p.owner_id = $1
  OR p.project_id IN (
    SELECT project_id
    FROM project_members
    WHERE user_id = $1
  )
`;

const OVERVIEW_PROJECTS_USER = `
  SELECT project_id, status, progress_percentage
  FROM projects
  WHERE owner_id = $1
     OR project_id IN (
       SELECT project_id
       FROM project_members
       WHERE user_id = $1
     )
`;

const OVERVIEW_PROJECTS_ADMIN = `
  SELECT project_id, status, progress_percentage
  FROM projects
`;

const normalizeLimit = (limit) => {
  const value = Number(limit);
  if (!Number.isInteger(value) || value <= 0) {
    return 10;
  }
  return Math.min(value, 50);
};

const getOverview = async (userId, isAdmin) => {
  const projectSource = isAdmin ? OVERVIEW_PROJECTS_ADMIN : OVERVIEW_PROJECTS_USER;
  const params = isAdmin ? [] : [userId];

  const result = await query(
    `WITH ap AS (${projectSource})
     SELECT
       COUNT(DISTINCT ap.project_id)::int AS total_projects,
       (COUNT(DISTINCT ap.project_id) FILTER (WHERE ap.status = 'planning'))::int AS planning_projects,
       (COUNT(DISTINCT ap.project_id) FILTER (WHERE ap.status = 'in_progress'))::int AS in_progress_projects,
       (COUNT(DISTINCT ap.project_id) FILTER (WHERE ap.status = 'on_hold'))::int AS on_hold_projects,
       (COUNT(DISTINCT ap.project_id) FILTER (WHERE ap.status = 'completed'))::int AS completed_projects,
       (COUNT(DISTINCT ap.project_id) FILTER (WHERE ap.status = 'cancelled'))::int AS cancelled_projects,
       COALESCE((SELECT AVG(progress_percentage) FROM ap), 0) AS average_project_progress,
       COUNT(t.task_id)::int AS total_tasks,
       (COUNT(t.task_id) FILTER (WHERE t.status = 'backlog'))::int AS backlog_tasks,
       (COUNT(t.task_id) FILTER (WHERE t.status = 'to_do'))::int AS to_do_tasks,
       (COUNT(t.task_id) FILTER (WHERE t.status = 'in_progress'))::int AS in_progress_tasks,
       (COUNT(t.task_id) FILTER (WHERE t.status = 'review'))::int AS review_tasks,
       (COUNT(t.task_id) FILTER (WHERE t.status = 'done'))::int AS done_tasks,
       (COUNT(t.task_id) FILTER (WHERE t.status = 'cancelled'))::int AS cancelled_tasks,
       (COUNT(t.task_id) FILTER (
         WHERE t.due_date < CURRENT_DATE
           AND t.status NOT IN ('done', 'cancelled')
       ))::int AS overdue_tasks,
       (COUNT(t.task_id) FILTER (
         WHERE t.due_date = CURRENT_DATE
           AND t.status NOT IN ('done', 'cancelled')
       ))::int AS tasks_due_today,
       (COUNT(t.task_id) FILTER (
         WHERE t.due_date > CURRENT_DATE
           AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
           AND t.status NOT IN ('done', 'cancelled')
       ))::int AS tasks_due_next_7_days,
       (COUNT(t.task_id) FILTER (WHERE t.agile_importance = 'critical'))::int AS critical_tasks,
       (COUNT(t.task_id) FILTER (WHERE t.urgency_priority = 'important_urgent'))::int AS important_urgent_tasks,
       COALESCE(SUM(t.estimated_minutes), 0) AS total_estimated_minutes,
       COALESCE(SUM(t.actual_minutes), 0) AS total_actual_minutes
     FROM ap
     LEFT JOIN tasks t ON t.project_id = ap.project_id`,
    params
  );

  const row = result.rows[0];

  return {
    total_projects: Number(row.total_projects),
    planning_projects: Number(row.planning_projects),
    in_progress_projects: Number(row.in_progress_projects),
    on_hold_projects: Number(row.on_hold_projects),
    completed_projects: Number(row.completed_projects),
    cancelled_projects: Number(row.cancelled_projects),
    average_project_progress: Number(row.average_project_progress),
    total_tasks: Number(row.total_tasks),
    backlog_tasks: Number(row.backlog_tasks),
    to_do_tasks: Number(row.to_do_tasks),
    in_progress_tasks: Number(row.in_progress_tasks),
    review_tasks: Number(row.review_tasks),
    done_tasks: Number(row.done_tasks),
    cancelled_tasks: Number(row.cancelled_tasks),
    overdue_tasks: Number(row.overdue_tasks),
    tasks_due_today: Number(row.tasks_due_today),
    tasks_due_next_7_days: Number(row.tasks_due_next_7_days),
    critical_tasks: Number(row.critical_tasks),
    important_urgent_tasks: Number(row.important_urgent_tasks),
    total_estimated_minutes: Number(row.total_estimated_minutes),
    total_actual_minutes: Number(row.total_actual_minutes),
  };
};

const getProjectsProgress = async (userId, isAdmin) => {
  const whereClause = isAdmin ? "" : `WHERE ${ACCESS_PROJECTS_USER}`;
  const params = isAdmin ? [] : [userId];

  const result = await query(
    `SELECT
       p.project_id,
       p.project_key,
       p.project_name,
       p.status,
       p.progress_percentage,
       COUNT(t.task_id)::int AS total_tasks,
       (COUNT(t.task_id) FILTER (WHERE t.status = 'done'))::int AS completed_tasks,
       (COUNT(t.task_id) FILTER (
         WHERE t.due_date < CURRENT_DATE
           AND t.status NOT IN ('done', 'cancelled')
       ))::int AS overdue_tasks
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.project_id
     ${whereClause}
     GROUP BY p.project_id
     ORDER BY p.updated_at DESC, p.project_id DESC`,
    params
  );

  return result.rows;
};

const AGILE_IMPORTANCE_ORDER = `
  CASE t.agile_importance
    WHEN 'critical' THEN 0
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
    ELSE 4
  END
`;

const getUpcomingTasks = async (userId, isAdmin, limit = 10) => {
  const safeLimit = normalizeLimit(limit);
  const accessClause = isAdmin ? "TRUE" : `(${ACCESS_PROJECTS_USER})`;
  const params = isAdmin ? [safeLimit] : [userId, safeLimit];

  const result = await query(
    `SELECT
       t.task_id,
       t.title,
       t.status,
       t.urgency_priority,
       t.agile_importance,
       t.start_date,
       t.due_date,
       t.progress_percentage,
       p.project_id,
       p.project_key,
       p.project_name,
       t.assigned_to,
       u.full_name AS assigned_to_name
     FROM tasks t
     JOIN projects p ON p.project_id = t.project_id
     LEFT JOIN users u ON u.user_id = t.assigned_to
     WHERE t.due_date IS NOT NULL
       AND t.status NOT IN ('done', 'cancelled')
       AND ${accessClause}
     ORDER BY t.due_date ASC,
       ${AGILE_IMPORTANCE_ORDER} ASC,
       t.task_id ASC
     LIMIT $${params.length}`,
    params
  );

  return result.rows;
};

module.exports = {
  getOverview,
  getProjectsProgress,
  getUpcomingTasks,
};
