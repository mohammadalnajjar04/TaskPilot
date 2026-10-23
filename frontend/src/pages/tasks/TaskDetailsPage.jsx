import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock, Percent, Timer, User } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../contexts/AuthContext";
import { taskService } from "../../services/taskService";

import { ErrorState } from "../../components/common/ErrorState";
import { ProgressBar } from "../../components/dashboard/ProjectProgressCard";
import { TaskDetailsHeader, LinkToTasks } from "../../components/tasks/TaskDetailsHeader";
import { TaskDetailsSkeleton } from "../../components/tasks/TaskDetailsSkeleton";
import { TaskOverviewCard } from "../../components/tasks/TaskOverviewCard";
import { TaskStatusActions } from "../../components/tasks/TaskStatusActions";
import { TaskCommentsSection } from "../../components/tasks/comments/TaskCommentsSection";
import { TaskStatusBadge } from "../../components/tasks/TaskStatusBadge";
import { TaskSummaryItem } from "../../components/tasks/TaskSummaryItem";
import { formatMinutes } from "../../components/tasks/TaskOverviewCard";
import { TaskAttachmentsSection } from "../../components/tasks/attachments/TaskAttachmentsSection";

const DASHBOARD_QUERY_KEYS = [
  ["dashboard", "overview"],
  ["dashboard", "projects-progress"],
  ["dashboard", "upcoming-tasks"],
];

function formatDate(value) {
  if (!value) return "Not set";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "Not set";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusErrorMessage(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;

  switch (code) {
    case "INVALID_STATUS_TRANSITION":
      return "This status change isn't allowed from the task's current status.";
    case "INVALID_PROGRESS":
      return errorBody?.message || "The task's progress doesn't match the selected status.";
    case "TASK_NOT_FOUND":
      return "This task no longer exists.";
    case "FORBIDDEN":
      return "You don't have permission to change this task's status.";
    case "VALIDATION_ERROR":
      return errorBody?.message || "The task data is invalid. Please try again.";
    default:
      return errorBody?.message || "Something went wrong. Please try again.";
  }
}

function getDeleteErrorMessage(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;

  if (code === "FORBIDDEN") {
    return "You don't have permission to delete this task.";
  }
  if (code === "TASK_NOT_FOUND") {
    return "This task no longer exists.";
  }
  return errorBody?.message || "Something went wrong. Please try again.";
}

export function TaskDetailsPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
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

  const statusMutation = useMutation({
    mutationFn: ({ status }) =>
      taskService
        .changeStatus(taskIdNum, { status })
        .then((result) => result.task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskIdNum] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      DASHBOARD_QUERY_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      toast.success("Task status updated.");
    },
    onError: (error) => {
      toast.error(getStatusErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => taskService.delete(taskIdNum),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskIdNum] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      DASHBOARD_QUERY_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      toast.success("Task deleted successfully.");
      navigate("/tasks");
    },
    onError: (error) => {
      toast.error(getDeleteErrorMessage(error));
    },
  });

  const handleStatusChange = (status) => {
    const current = taskQuery.data?.status;
    if (!current || status === current) return;
    statusMutation.mutate({ status });
  };

  const handleDelete = () => {
    const task = taskQuery.data;
    if (!task) return;
    const confirmed = window.confirm(
      `Delete task "${task.title}"? This action cannot be undone.`
    );
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  if (!isValidTaskId) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <LinkToTasks />
        <ErrorState
          title="Invalid task link"
          description="The task ID in the address isn't valid."
        />
      </div>
    );
  }

  if (taskQuery.isLoading) {
    return <TaskDetailsSkeleton />;
  }

  if (taskQuery.isError) {
    const status = taskQuery.error?.response?.status;
    const isForbidden = taskQuery.error?.response?.data?.error?.code === "FORBIDDEN";
    const isNotFound = status === 404;
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <LinkToTasks />
        <ErrorState
          title={
            isForbidden
              ? "Task not accessible"
              : isNotFound
                ? "Task not found"
                : "Couldn't load this task"
          }
          description={
            isForbidden
              ? "You don't have permission to view this task."
              : isNotFound
                ? "This task may have been deleted or the link is out of date."
                : "Something went wrong while loading this task. Please try again."
          }
          onRetry={() => taskQuery.refetch()}
        />
      </div>
    );
  }

  const task = taskQuery.data;
  const canDelete =
    user?.role === "admin" || Number(task.created_by) === Number(user?.user_id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <TaskDetailsHeader
        task={task}
        canDelete={canDelete}
        isDeleting={deleteMutation.isPending}
        onDelete={handleDelete}
      />

      <section aria-labelledby="task-summary-heading">
        <h2 id="task-summary-heading" className="sr-only">
          Task summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TaskSummaryItem label="Status" icon={CheckCircle2}>
            <TaskStatusBadge status={task.status} />
          </TaskSummaryItem>

          <TaskSummaryItem label="Progress" icon={Percent}>
            <div className="flex items-center gap-3">
              <ProgressBar
                value={task.progress_percentage}
                label={`${task.title} progress`}
              />
              <span className="shrink-0 text-sm font-semibold text-gray-900">
                {task.progress_percentage}%
              </span>
            </div>
          </TaskSummaryItem>

          <TaskSummaryItem label="Due date" icon={CalendarDays}>
            <span className="text-sm font-semibold text-gray-900">
              {formatDate(task.due_date)}
            </span>
          </TaskSummaryItem>

          <TaskSummaryItem label="Estimated time" icon={Clock}>
            <span className="text-sm font-semibold text-gray-900">
              {formatMinutes(task.estimated_minutes)}
            </span>
          </TaskSummaryItem>

          <TaskSummaryItem label="Actual time" icon={Timer}>
            <span className="text-sm font-semibold text-gray-900">
              {formatMinutes(task.actual_minutes)}
            </span>
          </TaskSummaryItem>

          <TaskSummaryItem label="Assignee" icon={User}>
            <span className="text-sm font-semibold text-gray-900">
              {task.assigned_to_name || "Unassigned"}
            </span>
          </TaskSummaryItem>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <TaskOverviewCard task={task} />
        </div>
        <TaskStatusActions
          task={task}
          isChanging={statusMutation.isPending}
          onChangeStatus={handleStatusChange}
        />
      </div>

      <TaskCommentsSection taskId={taskIdNum} />

      <TaskAttachmentsSection taskId={taskIdNum} />
    </div>
  );
}

export default TaskDetailsPage;
