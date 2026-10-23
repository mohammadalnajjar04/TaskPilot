import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderPlus, Plus, SearchX } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { projectService } from "../../services/projectService";

import { ProjectCard } from "../../components/projects/ProjectCard";
import { ProjectListToolbar } from "../../components/projects/ProjectListToolbar";
import { ProjectsSkeleton } from "../../components/projects/ProjectsSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Button } from "../../components/ui/Button";

const PROJECTS_QUERY_KEY = ["projects"];

const ctaButtonClasses =
  "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2";

export function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const projectsQuery = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => projectService.list().then((res) => res.projects),
  });

  const projects = projectsQuery.data ?? [];

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    let filtered = projects;
    if (query) {
      filtered = filtered.filter(
        (project) =>
          project.project_key.toLowerCase().includes(query) ||
          project.project_name.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (project) => project.status === statusFilter
      );
    }
    const sorted = [...filtered];
    const timestamp = (project) => new Date(project.created_at).getTime();
    switch (sortBy) {
      case "oldest":
        sorted.sort((a, b) => timestamp(a) - timestamp(b));
        break;
      case "progress-high":
        sorted.sort(
          (a, b) => b.progress_percentage - a.progress_percentage
        );
        break;
      case "progress-low":
        sorted.sort(
          (a, b) => a.progress_percentage - b.progress_percentage
        );
        break;
      default:
        sorted.sort((a, b) => timestamp(b) - timestamp(a));
    }
    return sorted;
  }, [projects, search, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  if (projectsQuery.isLoading) {
    return <ProjectsSkeleton />;
  }

  if (projectsQuery.isError) {
    return <ErrorState onRetry={() => projectsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track the progress of every project you own or are part of.
          </p>
        </div>
        <Button onClick={() => navigate("/projects/new")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Project
        </Button>
      </div>

      <ProjectListToolbar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="No projects yet"
          description="Create your first project to start organizing tasks and tracking progress."
          action={
            <Link to="/projects/new" className={ctaButtonClasses}>
              Create your first project
            </Link>
          }
        />
      ) : visibleProjects.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No projects match your filters"
          description="Try a different search term, status, or sorting option."
          action={
            <button
              type="button"
              onClick={clearFilters}
              className={ctaButtonClasses}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing {visibleProjects.length} of {projects.length} projects
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                isOwner={Number(project.owner_id) === Number(user?.user_id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ProjectsPage;
