import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Trash2, Users } from "lucide-react";

import { Button } from "../ui/Button";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

const backLinkClasses =
  "inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

const dangerButtonClasses =
  "inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function ProjectDetailsHeader({ project, canManage, isDeleting, onDelete }) {
  const navigate = useNavigate();

  return (
    <header className="space-y-6">
      <LinkToProjects />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary-700">
              {project.project_key}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <h1 className="break-words text-2xl font-semibold tracking-tight text-gray-900">
            {project.project_name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/projects/${project.project_id}/edit`)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/projects/${project.project_id}/members`)}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Members
          </Button>
          {canManage && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className={dangerButtonClasses}
            >
              {isDeleting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function LinkToProjects() {
  return (
    <Link to="/projects" className={backLinkClasses}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to projects
    </Link>
  );
}
