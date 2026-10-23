import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import { projectService } from "../../services/projectService";
import { ProjectForm } from "../../components/projects/ProjectForm";

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

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload) =>
      projectService.create(payload).then((result) => result.project),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      DASHBOARD_QUERY_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      toast.success("Project created successfully.");
      navigate(`/projects/${project.project_id}`);
    },
  });

  const handleFormSubmit = (values, formHelpers) => {
    mutation.mutate(buildProjectPayload(values), {
      onError: (error) => mapProjectErrors(error, formHelpers),
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to projects
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Create Project
        </h1>
        <p className="text-sm text-gray-500">
          Add a new project to start organizing tasks and tracking progress.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <ProjectForm
          mode="create"
          isSubmitting={mutation.isPending}
          onSubmit={handleFormSubmit}
          onCancel={() => navigate("/projects")}
          submitLabel="Create Project"
        />
      </div>
    </div>
  );
}

export default ProjectCreatePage;
