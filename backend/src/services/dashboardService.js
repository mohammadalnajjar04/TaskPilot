const dashboardRepository = require("../repositories/dashboardRepository");

const roundToTwoDecimals = (value) => Math.round(value * 100) / 100;

const normalizeLimit = (limit) => {
  const value = Number(limit);
  if (!Number.isInteger(value) || value <= 0) {
    return 10;
  }
  return Math.min(value, 50);
};

const formatISODate = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDashboardOverview = async (actor) => {
  const isAdmin = actor.role === "admin";

  const metrics = await dashboardRepository.getOverview(
    actor.user_id,
    isAdmin
  );

  const total_pending_tasks =
    metrics.backlog_tasks +
    metrics.to_do_tasks +
    metrics.in_progress_tasks +
    metrics.review_tasks;

  const project_completion_rate =
    metrics.total_projects > 0
      ? roundToTwoDecimals(
          (metrics.completed_projects / metrics.total_projects) * 100
        )
      : 0;

  const task_completion_rate =
    metrics.total_tasks > 0
      ? roundToTwoDecimals((metrics.done_tasks / metrics.total_tasks) * 100)
      : 0;

  return {
    ...metrics,
    total_pending_tasks,
    project_completion_rate,
    task_completion_rate,
  };
};

const getProjectsProgress = async (actor) => {
  const isAdmin = actor.role === "admin";

  const projects = await dashboardRepository.getProjectsProgress(
    actor.user_id,
    isAdmin
  );

  return projects.map((project) => {
    const total_tasks = Number(project.total_tasks);
    const completed_tasks = Number(project.completed_tasks);

    return {
      project_id: Number(project.project_id),
      project_key: project.project_key,
      project_name: project.project_name,
      status: project.status,
      progress_percentage: Number(project.progress_percentage),
      total_tasks,
      completed_tasks,
      overdue_tasks: Number(project.overdue_tasks),
      task_completion_rate:
        total_tasks > 0
          ? roundToTwoDecimals((completed_tasks / total_tasks) * 100)
          : 0,
    };
  });
};

const getUpcomingTasks = async (actor, limit) => {
  const isAdmin = actor.role === "admin";
  const safeLimit = normalizeLimit(limit);

  const tasks = await dashboardRepository.getUpcomingTasks(
    actor.user_id,
    isAdmin,
    safeLimit
  );

  return tasks.map((task) => ({
    task_id: Number(task.task_id),
    title: task.title,
    status: task.status,
    urgency_priority: task.urgency_priority,
    agile_importance: task.agile_importance,
    start_date: formatISODate(task.start_date),
    due_date: formatISODate(task.due_date),
    progress_percentage: Number(task.progress_percentage),
    project_id: Number(task.project_id),
    project_key: task.project_key,
    project_name: task.project_name,
    assigned_to: task.assigned_to === null ? null : Number(task.assigned_to),
    assigned_to_name: task.assigned_to_name,
  }));
};

module.exports = {
  getDashboardOverview,
  getProjectsProgress,
  getUpcomingTasks,
};
