import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import { taskService } from "../../services/taskService";
import {
  TaskForm,
  buildTaskPayload,
  mapTaskErrors,
} from "../../components/tasks/TaskForm";
import { TaskFormSkeleton } from "../../components/tasks/TaskFormSkeleton";
import { ErrorState } from "../../components/common/ErrorState";

const DASHBOARD_QUERY_KEYS = [
  ["dashboard", "overview"],
  ["dashboard", "projects-progress"],
  ["dashboard", "upcoming-tasks"],
];

const backLinkClasses =
  "inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

function BackToTasks() {
  return (
    <Link to="/tasks" className={backLinkClasses}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to tasks
    </Link>
  );
}

function toFormValues(task) {
  return {
    project_id: task.project_id != null ? String(task.project_id) : "",
    category_id: task.category_id != null ? String(task.category_id) : "",
    assigned_to: task.assigned_to != null ? String(task.assigned_to) : "",
    parent_task_id:
      task.parent_task_id != null ? String(task.parent_task_id) : "",
    title: task.title ?? "",
    description: task.description ?? "",
    status: task.status ?? "backlog",
    urgency_priority: task.urgency_priority ?? "important_not_urgent",
    agile_importance: task.agile_importance ?? "medium",
    start_date: task.start_date ? String(task.start_date).slice(0, 10) : "",
    due_date: task.due_date ? String(task.due_date).slice(0, 10) : "",
    estimated_minutes:
      task.estimated_minutes != null ? String(task.estimated_minutes) : "",
    actual_minutes:
      task.actual_minutes != null ? String(task.actual_minutes) : "0",
    progress_percentage:
      task.progress_percentage != null
        ? String(task.progress_percentage)
        : "0",
  };
}

export function TaskEditPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const taskIdNum = Number(taskId);
  const isValidTaskId = Number.isInteger(taskIdNum) && taskIdNum > 0;

  const taskQuery = useQuery({
    queryKey: ["task", taskIdNum],
    queryFn: () => taskService.get(taskIdNum).then((result) => result.task),
    enabled: isValidTaskId,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (payload) =>
      taskService.update(taskIdNum, payload).then((result) => result.task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskIdNum] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      DASHBOARD_QUERY_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      toast.success("Task updated successfully.");
      navigate(`/tasks/${taskIdNum}`);
    },
  });

  const handleFormSubmit = (values, formHelpers) => {
    mutation.mutate(buildTaskPayload(values), {
      onError: (error) => mapTaskErrors(error, formHelpers),
    });
  };

  if (!isValidTaskId) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackToTasks />
        <ErrorState
          title="Invalid task link"
          description="The task id in the address isn't valid."
        />
      </div>
    );
  }

  if (taskQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackToTasks />
        <div className="space-y-1.5">
          <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-200" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <TaskFormSkeleton />
        </div>
      </div>
    );
  }

  if (taskQuery.isError) {
    const status = taskQuery.error?.response?.status;
    const title =
      status === 404
        ? "Task not found"
        : status === 403
          ? "No access to this task"
          : "Couldn't load this task";
    const description =
      status === 404
        ? "This task may have been deleted or moved."
        : status === 403
          ? "You don't have permission to edit this task."
          : "Something went wrong while loading this task. Please try again.";

    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackToTasks />
        <ErrorState
          title={title}
          description={description}
          onRetry={() => taskQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <BackToTasks />
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Edit Task
        </h1>
        <p className="text-sm text-gray-500">
          Update the details for {taskQuery.data.title}.
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <TaskForm
          key={taskIdNum}
          initialValues={toFormValues(taskQuery.data)}
          isSubmitting={mutation.isPending}
          onSubmit={handleFormSubmit}
          onCancel={() => navigate(`/tasks/${taskIdNum}`)}
          submitLabel="Save Changes"
          currentTaskId={taskIdNum}
        />
      </div>
    </div>
  );
}

export default TaskEditPage;
