import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import { taskService } from "../../services/taskService";
import { projectService } from "../../services/projectService";
import {
  TaskForm,
  TASK_FORM_DEFAULTS,
  buildTaskPayload,
  mapTaskErrors,
} from "../../components/tasks/TaskForm";
import { TaskFormSkeleton } from "../../components/tasks/TaskFormSkeleton";
import { FormError } from "../../components/common/FormError";

const DASHBOARD_QUERY_KEYS = [
  ["dashboard", "overview"],
  ["dashboard", "projects-progress"],
  ["dashboard", "upcoming-tasks"],
];

const backLinkClasses =
  "inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

export function TaskCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const rawProjectId = searchParams.get("project_id") || "";
  const parsedProjectId = Number(rawProjectId);
  const hasValidProjectId =
    /^\d+$/.test(rawProjectId) &&
    Number.isInteger(parsedProjectId) &&
    parsedProjectId > 0;

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list().then((result) => result.projects),
    retry: false,
  });

  const projectIsAvailable = hasValidProjectId
    ? (projectsQuery.data ?? []).some(
        (project) => Number(project.project_id) === parsedProjectId
      )
    : false;

  const initialValues =
    hasValidProjectId && projectIsAvailable
      ? { ...TASK_FORM_DEFAULTS, project_id: String(parsedProjectId) }
      : TASK_FORM_DEFAULTS;

  const mutation = useMutation({
    mutationFn: (payload) =>
      taskService.create(payload).then((result) => result.task),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      DASHBOARD_QUERY_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      toast.success("Task created successfully.");
      navigate(`/tasks/${task.task_id}`);
    },
  });

  const handleFormSubmit = (values, formHelpers) => {
    mutation.mutate(buildTaskPayload(values), {
      onError: (error) => mapTaskErrors(error, formHelpers),
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link to="/tasks" className={backLinkClasses}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tasks
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Create Task
        </h1>
        <p className="text-sm text-gray-500">
          Add a new task to keep track of work in your projects.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {hasValidProjectId && projectsQuery.isLoading ? (
          <TaskFormSkeleton />
        ) : (
          <>
            {hasValidProjectId && !projectIsAvailable && (
              <div className="mb-6">
                <FormError message="The project you were linked to isn't available. Please select a project to continue." />
              </div>
            )}
            <TaskForm
              initialValues={initialValues}
              isSubmitting={mutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => navigate("/tasks")}
              submitLabel="Create Task"
            />
          </>
        )}
      </div>
    </div>
  );
}

export default TaskCreatePage;
