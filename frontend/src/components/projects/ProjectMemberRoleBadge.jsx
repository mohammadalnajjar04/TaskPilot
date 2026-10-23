const MEMBER_ROLES = {
  owner: { label: "Owner", classes: "bg-indigo-100 text-indigo-700" },
  manager: { label: "Manager", classes: "bg-blue-100 text-blue-700" },
  member: { label: "Member", classes: "bg-emerald-100 text-emerald-700" },
  viewer: { label: "Viewer", classes: "bg-gray-100 text-gray-600" },
};

export const ASSIGNABLE_MEMBER_ROLES = ["manager", "member", "viewer"];

export const MEMBER_ROLE_OPTIONS = Object.entries(MEMBER_ROLES)
  .filter(([value]) => value !== "owner")
  .map(([value, { label }]) => ({ value, label }));

export function ProjectMemberRoleBadge({ role }) {
  const meta = MEMBER_ROLES[role] || {
    label: role || "Unknown",
    classes: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.classes}`}
    >
      {meta.label}
    </span>
  );
}
