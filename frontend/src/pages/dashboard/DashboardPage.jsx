import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderKanban,
  FolderPlus,
  ListTodo,
  Percent,
  PlusCircle,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { dashboardService } from "../../services/dashboardService";

import { StatCard } from "../../components/dashboard/StatCard";
import { ProjectProgressCard } from "../../components/dashboard/ProjectProgressCard";
import { UpcomingTaskItem } from "../../components/dashboard/UpcomingTaskItem";
import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";

const DASHBOARD_QUERY_KEYS = {
  overview: ["dashboard", "overview"],
  projectsProgress: ["dashboard", "projects-progress"],
  upcomingTasks: ["dashboard", "upcoming-tasks", { limit: 8 }],
};

const UPCOMING_TASKS_LIMIT = 8;

const linkButtonClasses =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

const ctaButtonClasses =
  "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-US");
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return String(Math.round(num * 100) / 100);
}

export function DashboardPage() {
  const { user } = useAuth();

  const overviewQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.overview,
    queryFn: () => dashboardService.overview().then((res) => res.overview),
  });

  const projectsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.projectsProgress,
    queryFn: () =>
      dashboardService.projectsProgress().then((res) => res.projects),
  });

  const tasksQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.upcomingTasks,
    queryFn: () =>
      dashboardService
        .upcomingTasks({ limit: UPCOMING_TASKS_LIMIT })
        .then((res) => res.tasks),
  });

  const isLoading =
    overviewQuery.isLoading || projectsQuery.isLoading || tasksQuery.isLoading;
  const isError =
    overviewQuery.isError || projectsQuery.isError || tasksQuery.isError;

  const retryAll = () => {
    overviewQuery.refetch();
    projectsQuery.refetch();
    tasksQuery.refetch();
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return <ErrorState onRetry={retryAll} />;
  }

  const overview = overviewQuery.data;
  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const firstName = (user?.full_name || "there").trim().split(/\s+/)[0];
  const greeting = getGreeting();
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <section aria-labelledby="dashboard-greeting">
        <h2
          id="dashboard-greeting"
          className="text-2xl font-semibold tracking-tight text-gray-900"
        >
          {greeting}, {firstName}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Here's a snapshot of your work — stay on track, one task at a time.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {todayLabel}
        </p>
      </section>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={FolderKanban}
            label="Total Projects"
            value={formatNumber(overview.total_projects)}
            description="Across your workspace"
            tone="primary"
          />
          <StatCard
            icon={ListTodo}
            label="Total Tasks"
            value={formatNumber(overview.total_tasks)}
            description="All tasks in scope"
            tone="blue"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Tasks"
            value={formatNumber(overview.done_tasks)}
            description="Marked as done"
            tone="emerald"
          />
          <StatCard
            icon={AlarmClock}
            label="Overdue Tasks"
            value={formatNumber(overview.overdue_tasks)}
            description="Past their due date"
            tone="red"
          />
          <StatCard
            icon={Clock}
            label="Pending Tasks"
            value={formatNumber(overview.total_pending_tasks)}
            description="Not completed yet"
            tone="amber"
          />
          <StatCard
            icon={Percent}
            label="Task Completion Rate"
            value={`${formatPercent(overview.task_completion_rate)}%`}
            description="Completed of total tasks"
            tone="violet"
          />
        </div>
      </section>

      <section aria-labelledby="projects-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="projects-heading"
            className="text-lg font-semibold tracking-tight text-gray-900"
          >
            Projects
          </h2>
          {projects.length > 0 && (
            <Link to="/projects" className={linkButtonClasses}>
              View all projects
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="No projects yet"
            description="Create your first project to start tracking progress and tasks."
            action={
              <Link to="/projects" className={ctaButtonClasses}>
                Browse projects
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <ProjectProgressCard key={project.project_id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="tasks-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="tasks-heading"
            className="text-lg font-semibold tracking-tight text-gray-900"
          >
            Upcoming Tasks
          </h2>
          {tasks.length > 0 && (
            <Link to="/tasks" className={linkButtonClasses}>
              View all tasks
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={PlusCircle}
            title="No upcoming tasks"
            description="Tasks with upcoming due dates will show up here once they're created."
            action={
              <Link to="/tasks" className={ctaButtonClasses}>
                Browse tasks
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <UpcomingTaskItem key={task.task_id} task={task} />
            ))}
          </div>
        )}
        </section>
    </div>
  );
}

export default DashboardPage;
