import { CalendarDays, Clock, FileText, User } from "lucide-react";

import { ProgressBar } from "../dashboard/ProjectProgressCard";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

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

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DetailRow({ label, children }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm text-gray-900">{children}</dd>
    </div>
  );
}

export function ProjectOverviewCard({ project }) {
  const {
    description,
    owner_id,
    start_date,
    end_date,
    status,
    progress_percentage,
    created_at,
    updated_at,
  } = project;

  return (
    <section
      aria-labelledby="project-information-heading"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="project-information-heading"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900"
      >
        <FileText className="h-5 w-5 text-primary-500" aria-hidden="true" />
        Project information
      </h2>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Description
        </p>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-gray-900">
          {description?.trim() || "No description provided."}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <DetailRow label="Owner ID">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {String(owner_id ?? "—")}
          </span>
        </DetailRow>

        <DetailRow label="Status">
          <ProjectStatusBadge status={status} />
        </DetailRow>

        <DetailRow label="Progress">
          <div className="flex items-center gap-3">
            <ProgressBar
              value={progress_percentage}
              label={`${project.project_name} progress`}
            />
            <span className="shrink-0 text-sm font-semibold text-gray-900">
              {progress_percentage}%
            </span>
          </div>
        </DetailRow>

        <DetailRow label="Start date">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDate(start_date)}
          </span>
        </DetailRow>

        <DetailRow label="End date">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDate(end_date)}
          </span>
        </DetailRow>

        <DetailRow label="Created">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDateTime(created_at)}
          </span>
        </DetailRow>

        <DetailRow label="Last updated">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {formatDateTime(updated_at)}
          </span>
        </DetailRow>
      </dl>
    </section>
  );
}
