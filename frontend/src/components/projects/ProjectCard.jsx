import { Link } from "react-router-dom";
import { CalendarDays, Eye, Pencil, User } from "lucide-react";

import { ProgressBar } from "../dashboard/ProjectProgressCard";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

const viewLinkClasses =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

const editLinkClasses =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

function formatDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectCard({ project, isOwner = false }) {
  const {
    project_id,
    project_key,
    project_name,
    description,
    progress_percentage,
    start_date,
    end_date,
  } = project;

  const startLabel = formatDate(start_date);
  const endLabel = formatDate(end_date);

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary-700">
            {project_key}
          </span>
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {project_name}
          </h3>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      {description && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{description}</p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <ProgressBar
          value={progress_percentage}
          label={`${project_name} progress`}
        />
        <span className="shrink-0 text-sm font-semibold text-gray-900">
          {progress_percentage}%
        </span>
      </div>

      {(startLabel || endLabel) && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
          {startLabel && <span>Start {startLabel}</span>}
          {startLabel && endLabel && <span aria-hidden="true">·</span>}
          {endLabel && <span>End {endLabel}</span>}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4">
        {isOwner && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            <User className="h-3 w-3" aria-hidden="true" />
            Owner
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link to={`/projects/${project_id}`} className={viewLinkClasses}>
            <Eye className="h-4 w-4" aria-hidden="true" />
            View
          </Link>
          <Link to={`/projects/${project_id}/edit`} className={editLinkClasses}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
