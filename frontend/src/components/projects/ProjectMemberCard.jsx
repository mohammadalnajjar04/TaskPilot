import { Loader2, Pencil, Trash2 } from "lucide-react";

import { EditProjectMemberRoleForm } from "./EditProjectMemberRoleForm";
import { ProjectMemberRoleBadge } from "./ProjectMemberRoleBadge";

const actionButtonClasses =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60";

const dangerButtonClasses =
  "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-60";

function getInitials(fullName) {
  if (!fullName) return "?";
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ActiveBadge({ active }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-gray-400"
        }`}
        aria-hidden="true"
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function ProjectMemberCard({
  member,
  isOwner = false,
  canManage = false,
  editing = false,
  isSubmitting = false,
  isRemoving = false,
  onEdit,
  onRemove,
  onSubmitRole,
  onCancelEdit,
}) {
  const name = isOwner ? "Project owner" : member.full_name;
  const identityLine = isOwner ? `Owner ID: ${member.user_id}` : member.email;
  const initials = isOwner ? "O" : getInitials(member.full_name);
  const joinedLabel = `Member since ${formatDate(member.joined_at)}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isOwner ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"
          }`}
          aria-hidden="true"
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <ProjectMemberRoleBadge role={member.member_role} />
            {!isOwner && <ActiveBadge active={member.is_active} />}
          </div>
          <p className="mt-0.5 break-words text-sm text-gray-500">
            {identityLine}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{joinedLabel}</p>
        </div>

        {canManage && !isOwner && !editing && (
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onEdit} className={actionButtonClasses}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={isRemoving}
              className={dangerButtonClasses}
            >
              {isRemoving && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          </div>
        )}
      </div>

      {canManage && !isOwner && editing && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <EditProjectMemberRoleForm
            userId={member.user_id}
            currentRole={member.member_role}
            isSubmitting={isSubmitting}
            onSubmit={onSubmitRole}
            onCancel={onCancelEdit}
          />
        </div>
      )}
    </div>
  );
}
