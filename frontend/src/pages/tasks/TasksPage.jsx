import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ListTodo, Plus, SearchX } from "lucide-react";

import { taskService } from "../../services/taskService";
import { projectService } from "../../services/projectService";
import { categoryService } from "../../services/categoryService";

import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { TaskCard } from "../../components/tasks/TaskCard";
import { TaskListToolbar } from "../../components/tasks/TaskListToolbar";
import { TasksSkeleton } from "../../components/tasks/TasksSkeleton";

function toDateKey(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function currentDateKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function sortByDue(a, b, direction) {
  const da = toDateKey(a.due_date);
  const db = toDateKey(b.due_date);
  if (da === null && db === null) return 0;
  if (da === null) return direction === "asc" ? 1 : -1;
  if (db === null) return direction === "asc" ? -1 : 1;
  return direction === "asc" ? da.localeCompare(db) : db.localeCompare(da);
}

export function TasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get("status") || "";
  const urgencyPriority = searchParams.get("urgency_priority") || "";
  const agileImportance = searchParams.get("agile_importance") || "";
  const projectId = searchParams.get("project_id") || "";
  const categoryId = searchParams.get("category_id") || "";
  const assignedTo = searchParams.get("assigned_to") || "";
  const createdBy = searchParams.get("created_by") || "";
  const overdue = searchParams.get("overdue") === "1";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";

  const filters = {
    q,
    status,
    urgency_priority: urgencyPriority,
    agile_importance: agileImportance,
    project_id: projectId,
    category_id: categoryId,
    assigned_to: assignedTo,
    created_by: createdBy,
    overdue,
    sort,
  };

  const serverFilters = useMemo(() => {
    const result = {};
    if (status) result.status = status;
    if (urgencyPriority) result.urgency_priority = urgencyPriority;
    if (agileImportance) result.agile_importance = agileImportance;
    if (projectId) result.project_id = Number(projectId);
    if (categoryId) result.category_id = Number(categoryId);
    if (assignedTo) result.assigned_to = Number(assignedTo);
    if (createdBy) result.created_by = Number(createdBy);
    return result;
  }, [
    status,
    urgencyPriority,
    agileImportance,
    projectId,
    categoryId,
    assignedTo,
    createdBy,
  ]);

  const patchParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next, { replace: true });
  };

  const tasksQuery = useQuery({
    queryKey: ["tasks", serverFilters],
    queryFn: () => taskService.list(serverFilters).then((result) => result.tasks),
    retry: false,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list().then((result) => result.projects),
    retry: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      categoryService.list().then((result) => result.categories),
    retry: false,
  });

  const assignedToOptions = useMemo(() => {
    const seen = new Map();
    (tasksQuery.data ?? []).forEach((task) => {
      if (task.assigned_to != null && !seen.has(Number(task.assigned_to))) {
        seen.set(
          Number(task.assigned_to),
          task.assigned_to_name || `User ${task.assigned_to}`
        );
      }
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [tasksQuery.data]);

  const createdByOptions = useMemo(() => {
    const seen = new Map();
    (tasksQuery.data ?? []).forEach((task) => {
      if (task.created_by != null && !seen.has(Number(task.created_by))) {
        seen.set(
          Number(task.created_by),
          task.created_by_name || `User ${task.created_by}`
        );
      }
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [tasksQuery.data]);

  const hasActiveFilters = Boolean(
    filters.status ||
      filters.urgency_priority ||
      filters.agile_importance ||
      filters.project_id ||
      filters.category_id ||
      filters.assigned_to ||
      filters.created_by ||
      filters.overdue ||
      filters.q.trim()
  );

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const visibleTasks = useMemo(() => {
    let list = tasksQuery.data ?? [];

    if (overdue) {
      const today = currentDateKey();
      list = list.filter(
        (task) =>
          task.status !== "done" &&
          task.status !== "cancelled" &&
          toDateKey(task.due_date) !== null &&
          toDateKey(task.due_date) < today
      );
    }

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((task) => task.title.toLowerCase().includes(query));
    }

    const sorted = [...list];
    switch (sort) {
      case "oldest":
        sorted.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "due-asc":
        sorted.sort((a, b) => sortByDue(a, b, "asc"));
        break;
      case "due-desc":
        sorted.sort((a, b) => sortByDue(a, b, "desc"));
        break;
      case "progress-high":
        sorted.sort(
          (a, b) =>
            Number(b.progress_percentage ?? 0) -
            Number(a.progress_percentage ?? 0)
        );
        break;
      case "progress-low":
        sorted.sort(
          (a, b) =>
            Number(a.progress_percentage ?? 0) -
            Number(b.progress_percentage ?? 0)
        );
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
    return sorted;
  }, [tasksQuery.data, overdue, q, sort]);

  if (tasksQuery.isLoading) {
    return <TasksSkeleton />;
  }

  if (tasksQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <ErrorState
          title="Couldn't load tasks"
          description="Something went wrong while loading your tasks. Please try again."
          onRetry={() => tasksQuery.refetch()}
        />
      </div>
    );
  }

  const hasNoTasks = tasksQuery.data.length === 0;
  const hasNoMatches = visibleTasks.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Tasks
          </h1>
          <p className="text-sm text-gray-500">
            Track and manage tasks across your projects.
          </p>
        </div>
        <Button onClick={() => navigate("/tasks/new")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Task
        </Button>
      </header>

      <TaskListToolbar
        filters={filters}
        projects={projectsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        assignedToOptions={assignedToOptions}
        createdByOptions={createdByOptions}
        onChange={patchParams}
        onClear={clearFilters}
        canClear={hasActiveFilters}
      />

      {hasNoTasks && !hasActiveFilters ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Create your first task to start tracking work."
          action={
            <Button onClick={() => navigate("/tasks/new")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Task
            </Button>
          }
        />
      ) : hasNoMatches ? (
        <EmptyState
          icon={SearchX}
          title="No matching tasks"
          description="Try adjusting your search or filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <section aria-labelledby="tasks-list-heading">
          <h2 id="tasks-list-heading" className="sr-only">
            Tasks
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTasks.map((task) => (
              <li key={task.task_id}>
                <TaskCard task={task} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default TasksPage;
