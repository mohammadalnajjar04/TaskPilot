import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Percent } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../contexts/AuthContext";
import { projectService } from "../../services/projectService";

import { ErrorState } from "../../components/common/ErrorState";
import { ProgressBar } from "../../components/dashboard/ProjectProgressCard";
import { ProjectDetailsHeader, LinkToProjects } from "../../components/projects/ProjectDetailsHeader";
import { ProjectOverviewCard } from "../../components/projects/ProjectOverviewCard";
import { ProjectStatusBadge } from "../../components/projects/ProjectStatusBadge";
import { ProjectSummaryItem } from "../../components/projects/ProjectSummaryItem";

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

function getDeleteErrorMessage(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }
  const errorBody = error.response.data?.error;
  const code = errorBody?.code;
  if (code === "FORBIDDEN") {
    return "You don't have permission to delete this project.";
  }
  if (code === "PROJECT_NOT_FOUND") {
    return "This project no longer exists.";
  }
  return errorBody?.message || "Something went wrong. Please try again.";
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6" role="status" aria-live="polite">
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const projectIdNum = Number(projectId);
  const isValidProjectId = Number.isInteger(projectIdNum) && projectIdNum > 0;

  const projectQuery = useQuery({
    queryKey: ["project", projectIdNum],
    queryFn: () => projectService.get(projectIdNum).then((result) => result.project),
    enabled: isValidProjectId,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.delete(projectIdNum),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      DASHBOARD_QUERY_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      toast.success("Project deleted successfully.");
      navigate("/projects");
    },
    onError: (error) => {
      toast.error(getDeleteErrorMessage(error));
    },
  });

  const handleDelete = () => {
    const project = projectQuery.data;
    if (!project) return;
    const confirmed = window.confirm(
      `Delete project "${project.project_name}"? This action cannot be undone.`
    );
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  if (!isValidProjectId) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <LinkToProjects />
        <ErrorState
          title="Invalid project link"
          description="The project ID in the address isn't valid."
        />
      </div>
    );
  }

  if (projectQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (projectQuery.isError) {
    const error = projectQuery.error;
    const isForbidden = error?.response?.data?.error?.code === "FORBIDDEN";
    const isNotFound = error?.response?.status === 404;
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <LinkToProjects />
        <ErrorState
          title={
            isForbidden
              ? "Project not accessible"
              : isNotFound
                ? "Project not found"
                : "Couldn't load this project"
          }
          description={
            isForbidden
              ? "You don't have permission to view this project."
              : isNotFound
                ? "This project may have been deleted or the link is out of date."
                : "Something went wrong while loading the project. Please try again."
          }
          onRetry={() => projectQuery.refetch()}
        />
      </div>
    );
  }

  const project = projectQuery.data;
  const canManage =
    user?.role === "admin" || Number(project.owner_id) === Number(user?.user_id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <ProjectDetailsHeader
        project={project}
        canManage={canManage}
        isDeleting={deleteMutation.isPending}
        onDelete={handleDelete}
      />

      <section aria-labelledby="project-summary-heading">
        <h2 id="project-summary-heading" className="sr-only">
          Project summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProjectSummaryItem label="Progress" icon={Percent}>
            <div className="flex items-center gap-3">
              <ProgressBar
                value={project.progress_percentage}
                label={`${project.project_name} progress`}
              />
              <span className="shrink-0 text-sm font-semibold text-gray-900">
                {project.progress_percentage}%
              </span>
            </div>
          </ProjectSummaryItem>

          <ProjectSummaryItem label="Status" icon={CheckCircle2}>
            <ProjectStatusBadge status={project.status} />
          </ProjectSummaryItem>

          <ProjectSummaryItem label="Start date" icon={CalendarDays}>
            <span className="text-sm font-semibold text-gray-900">
              {formatDate(project.start_date)}
            </span>
          </ProjectSummaryItem>

          <ProjectSummaryItem label="End date" icon={CalendarDays}>
            <span className="text-sm font-semibold text-gray-900">
              {formatDate(project.end_date)}
            </span>
          </ProjectSummaryItem>
        </div>
      </section>

      <ProjectOverviewCard project={project} />
    </div>
  );
}

export default ProjectDetailsPage;
