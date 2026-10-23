import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import { projectService } from "../../services/projectService";
import { ProjectForm } from "../../components/projects/ProjectForm";
import { ErrorState } from "../../components/common/ErrorState";

const DASHBOARD_QUERY_KEYS = [
  ["dashboard", "overview"],
  ["dashboard", "projects-progress"],
  ["dashboard", "upcoming-tasks"],
];

const FORM_FIELDS = [
  "project_key",
  "project_name",
  "description",
  "start_date",
  "end_date",
  "status",
  "progress_percentage",
];

const backLinkClasses =
  "inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

function BackToProjects() {
  return (
    <Link to="/projects" className={backLinkClasses}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to projects
    </Link>
  );
}

function toFormValues(project) {
  return {
    project_key: project.project_key ?? "",
    project_name: project.project_name ?? "",
    description: project.description ?? "",
    start_date: project.start_date
      ? String(project.start_date).slice(0, 10)
      : "",
    end_date: project.end_date ? String(project.end_date).slice(0, 10) : "",
    status: project.status ?? "planning",
    progress_percentage: Number(project.progress_percentage ?? 0),
  };
}

function buildProjectPayload(values) {
  return {
    project_key: String(values.project_key).trim().toUpperCase(),
    project_name: String(values.project_name).trim(),
    description: String(values.description).trim(),
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    status: values.status,
    progress_percentage: Number(values.progress_percentage),
  };
}

function mapProjectErrors(error, { setError, setFormError }) {
  if (!error?.response) {
    setFormError(
      error?.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : "Network error. Please check your connection and try again."
    );
    return;
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;
  const fallbackMessage =
    errorBody?.message || "Something went wrong. Please try again.";

  switch (code) {
    case "PROJECT_KEY_ALREADY_EXISTS":
      setError("project_key", {
        type: "server",
        message: "A project with this key already exists.",
      });
      return;
    case "PROJECT_NAME_ALREADY_EXISTS":
      setError("project_name", {
        type: "server",
        message: "A project with this name already exists.",
      });
      return;
    case "VALIDATION_ERROR": {
      const details = Array.isArray(errorBody?.details)
        ? errorBody.details
        : [];
      let mappedAny = false;
      for (const detail of details) {
        if (detail?.field && FORM_FIELDS.includes(detail.field)) {
          setError(detail.field, {
            type: "server",
            message: detail.message,
          });
          mappedAny = true;
        }
      }
      if (mappedAny) return;
      setFormError(fallbackMessage);
      return;
    }
    case "INVALID_DATE_RANGE":
      setError("end_date", {
        type: "server",
        message: "End date cannot be before the start date.",
      });
      return;
    case "INVALID_PROGRESS":
      setError("progress_percentage", {
        type: "server",
        message: fallbackMessage,
      });
      return;
    default:
      setFormError(fallbackMessage);
  }
}

export function ProjectEditPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const projectIdNum = Number(projectId);
  const isValidProjectId = Number.isInteger(projectIdNum) && projectIdNum > 0;

  const projectQuery = useQuery({
    queryKey: ["project", projectIdNum],
    queryFn: () =>
      projectService.get(projectIdNum).then((result) => result.project),
    enabled: isValidProjectId,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (payload) =>
      projectService
        .update(projectIdNum, payload)
        .then((result) => result.project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectIdNum] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      DASHBOARD_QUERY_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      toast.success("Project updated successfully.");
      navigate(`/projects/${projectIdNum}`);
    },
  });

  const handleFormSubmit = (values, formHelpers) => {
    mutation.mutate(buildProjectPayload(values), {
      onError: (error) => mapProjectErrors(error, formHelpers),
    });
  };

  if (!isValidProjectId) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackToProjects />
        <ErrorState
          title="Invalid project link"
          description="The project id in the address isn't valid."
        />
      </div>
    );
  }

  if (projectQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackToProjects />
        <div className="space-y-1.5">
          <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-200" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-5" role="status" aria-label="Loading project">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
            </div>
            <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (projectQuery.isError) {
    const status = projectQuery.error?.response?.status;
    const title =
      status === 404
        ? "Project not found"
        : status === 403
          ? "No access to this project"
          : "Couldn't load this project";
    const description =
      status === 404
        ? "This project may have been deleted or moved."
        : status === 403
          ? "You don't have permission to edit this project."
          : "Something went wrong while loading this project. Please try again.";

    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackToProjects />
        <ErrorState
          title={title}
          description={description}
          onRetry={() => projectQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <BackToProjects />
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Edit Project
        </h1>
        <p className="text-sm text-gray-500">
          Update the details for {projectQuery.data.project_name}.
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <ProjectForm
          key={projectIdNum}
          mode="edit"
          initialValues={toFormValues(projectQuery.data)}
          isSubmitting={mutation.isPending}
          onSubmit={handleFormSubmit}
          onCancel={() => navigate(`/projects/${projectIdNum}`)}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}

export default ProjectEditPage;
