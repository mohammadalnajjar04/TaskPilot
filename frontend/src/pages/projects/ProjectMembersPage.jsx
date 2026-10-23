import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../contexts/AuthContext";
import { projectService } from "../../services/projectService";

import { ErrorState } from "../../components/common/ErrorState";
import { ProjectStatusBadge } from "../../components/projects/ProjectStatusBadge";
import { AddProjectMemberForm } from "../../components/projects/AddProjectMemberForm";
import { ProjectMemberCard } from "../../components/projects/ProjectMemberCard";
import { ProjectMembersSkeleton } from "../../components/projects/ProjectMembersSkeleton";

const backLinkClasses =
  "inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";

function BackToProject({ projectId }) {
  return (
    <Link to={`/projects/${projectId}`} className={backLinkClasses}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to project
    </Link>
  );
}

function getLoadState(error) {
  const status = error?.response?.status;
  if (status === 404) {
    return {
      title: "Project not found",
      description:
        "This project may have been deleted or the link is out of date.",
    };
  }
  if (status === 403) {
    return {
      title: "No access to this project",
      description:
        "You don't have permission to view members of this project.",
    };
  }
  return {
    title: "Couldn't load project members",
    description:
      "Something went wrong while loading the members. Please try again.",
  };
}

function getNetworkOrFallback(error, setFormError) {
  if (!error?.response) {
    setFormError(
      error?.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : "Network error. Please check your connection and try again."
    );
    return true;
  }
  return false;
}

function mapAddMemberErrors(error, { setError, setFormError }) {
  if (getNetworkOrFallback(error, setFormError)) return;

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;
  const fallbackMessage =
    errorBody?.message || "Something went wrong. Please try again.";

  switch (code) {
    case "PROJECT_NOT_FOUND":
      setFormError("This project no longer exists.");
      return;
    case "USER_NOT_FOUND":
      setError("user_id", {
        type: "server",
        message: "No user with this ID was found.",
      });
      return;
    case "USER_NOT_ACTIVE":
      setError("user_id", {
        type: "server",
        message: "This user account is inactive.",
      });
      return;
    case "PROJECT_MEMBER_ALREADY_EXISTS":
      setError("user_id", {
        type: "server",
        message: "This user is already a member of the project.",
      });
      return;
    case "INVALID_MEMBER_ROLE":
      setError("member_role", {
        type: "server",
        message: "Select a valid member role.",
      });
      return;
    case "FORBIDDEN":
      setFormError(
        "You don't have permission to manage members of this project."
      );
      return;
    case "VALIDATION_ERROR": {
      const details = Array.isArray(errorBody?.details) ? errorBody.details : [];
      let mappedAny = false;
      for (const detail of details) {
        if (detail?.field === "user_id" || detail?.field === "member_role") {
          setError(detail.field, {
            type: "server",
            message: detail.message,
          });
          mappedAny = true;
        }
      }
      if (!mappedAny) setFormError(fallbackMessage);
      return;
    }
    default:
      setFormError(fallbackMessage);
  }
}

function mapEditRoleErrors(error, { setError, setFormError }) {
  if (getNetworkOrFallback(error, setFormError)) return;

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;
  const fallbackMessage =
    errorBody?.message || "Something went wrong. Please try again.";

  switch (code) {
    case "PROJECT_NOT_FOUND":
      setFormError("This project no longer exists.");
      return;
    case "PROJECT_MEMBER_NOT_FOUND":
      setFormError("This member is no longer part of the project.");
      return;
    case "CANNOT_MODIFY_OWNER":
      setFormError("The project owner's role cannot be changed.");
      return;
    case "INVALID_MEMBER_ROLE":
      setError("member_role", {
        type: "server",
        message: "Select a valid member role.",
      });
      return;
    case "FORBIDDEN":
      setFormError(
        "You don't have permission to manage members of this project."
      );
      return;
    default:
      setFormError(fallbackMessage);
  }
}

function getRemoveMemberErrorMessage(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;

  if (code === "FORBIDDEN") {
    return "You don't have permission to remove members from this project.";
  }
  if (code === "PROJECT_MEMBER_NOT_FOUND") {
    return "This member is no longer part of the project.";
  }
  if (code === "CANNOT_MODIFY_OWNER") {
    return "The project owner cannot be removed.";
  }
  if (code === "PROJECT_NOT_FOUND") {
    return "This project no longer exists.";
  }
  return errorBody?.message || "Something went wrong. Please try again.";
}

export function ProjectMembersPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState(null);

  const projectIdNum = Number(projectId);
  const isValidProjectId = Number.isInteger(projectIdNum) && projectIdNum > 0;

  const projectQuery = useQuery({
    queryKey: ["project", projectIdNum],
    queryFn: () =>
      projectService.get(projectIdNum).then((result) => result.project),
    enabled: isValidProjectId,
    retry: false,
  });

  const membersQuery = useQuery({
    queryKey: ["project-members", projectIdNum],
    queryFn: () =>
      projectService.listMembers(projectIdNum).then((result) => result.members),
    enabled: isValidProjectId,
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: (payload) => projectService.addMember(projectIdNum, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", projectIdNum],
      });
      toast.success("Member added successfully.");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, member_role }) =>
      projectService.updateMember(projectIdNum, userId, { member_role }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", projectIdNum],
      });
      toast.success("Member role updated.");
      setEditingUserId(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId) => projectService.removeMember(projectIdNum, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", projectIdNum],
      });
      toast.success("Member removed successfully.");
      setEditingUserId(null);
    },
    onError: (error) => {
      toast.error(getRemoveMemberErrorMessage(error));
    },
  });

  const handleAddMember = (values, helpers) => {
    return addMutation.mutateAsync(
      { user_id: values.user_id, member_role: values.member_role },
      { onError: (error) => mapAddMemberErrors(error, helpers) }
    );
  };

  const handleUpdateRole = (userId) => (values, helpers) => {
    return updateRoleMutation.mutateAsync(
      { userId, member_role: values.member_role },
      { onError: (error) => mapEditRoleErrors(error, helpers) }
    );
  };

  const handleRemoveMember = (member) => {
    const confirmed = window.confirm(
      `Remove ${member.full_name} from this project?`
    );
    if (confirmed) {
      removeMutation.mutate(member.user_id);
    }
  };

  if (!isValidProjectId) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <BackToProject projectId={projectId} />
        <ErrorState
          title="Invalid project link"
          description="The project ID in the address isn't valid."
        />
      </div>
    );
  }

  if (projectQuery.isLoading || membersQuery.isLoading) {
    return <ProjectMembersSkeleton />;
  }

  if (projectQuery.isError || membersQuery.isError) {
    const error = projectQuery.isError ? projectQuery.error : membersQuery.error;
    const loadState = getLoadState(error);
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <BackToProject projectId={projectIdNum} />
        <ErrorState
          title={loadState.title}
          description={loadState.description}
          onRetry={() => {
            projectQuery.refetch();
            membersQuery.refetch();
          }}
        />
      </div>
    );
  }

  const project = projectQuery.data;
  const members = membersQuery.data;
  const canManage =
    user?.role === "admin" || Number(project.owner_id) === Number(user?.user_id);
  const memberCount = members.length + 1;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-6">
        <BackToProject projectId={projectIdNum} />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary-700">
              {project.project_key}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Project Members
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {project.project_name} · {memberCount}{" "}
            {memberCount === 1 ? "member" : "members"}
          </p>
          <p className="text-xs text-gray-400">
            {canManage
              ? "You can add members, change roles, and remove members."
              : "You can view members and their roles."}
          </p>
        </div>
      </header>

      {canManage && (
        <AddProjectMemberForm
          isSubmitting={addMutation.isPending}
          onSubmit={handleAddMember}
        />
      )}

      <section aria-labelledby="members-heading" className="space-y-3">
        <h2 id="members-heading" className="sr-only">
          Members
        </h2>

        <ul className="space-y-3">
          <li>
            <ProjectMemberCard
              member={{
                user_id: project.owner_id,
                member_role: "owner",
                joined_at: project.created_at,
              }}
              isOwner
            />
          </li>

          {members.map((member) => (
            <li key={member.user_id}>
              <ProjectMemberCard
                member={member}
                canManage={canManage}
                editing={editingUserId === member.user_id}
                isSubmitting={
                  updateRoleMutation.isPending &&
                  updateRoleMutation.variables?.userId === member.user_id
                }
                isRemoving={
                  removeMutation.isPending &&
                  removeMutation.variables === member.user_id
                }
                onEdit={() => setEditingUserId(member.user_id)}
                onRemove={() => handleRemoveMember(member)}
                onSubmitRole={handleUpdateRole(member.user_id)}
                onCancelEdit={() => setEditingUserId(null)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ProjectMembersPage;
