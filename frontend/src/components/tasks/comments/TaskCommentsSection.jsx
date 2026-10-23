import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../../contexts/AuthContext";
import { taskService } from "../../../services/taskService";

import { EmptyState } from "../../common/EmptyState";
import { ErrorState } from "../../common/ErrorState";

import { TaskCommentForm } from "./TaskCommentForm";
import { TaskCommentItem } from "./TaskCommentItem";
import { TaskCommentsSkeleton } from "./TaskCommentsSkeleton";

function getMessageFromError(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }
  const errorBody = error.response.data?.error;
  return errorBody?.message || "Something went wrong. Please try again.";
}

function getDeleteErrorMessage(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }
  const errorBody = error.response.data?.error;
  switch (errorBody?.code) {
    case "COMMENT_NOT_FOUND":
      return "This comment no longer exists.";
    case "TASK_NOT_FOUND":
      return "This task no longer exists.";
    case "FORBIDDEN":
      return "You don't have permission to delete this comment.";
    default:
      return errorBody?.message || "Something went wrong. Please try again.";
  }
}

function mapFormErrors(error, { setError, setFormError }) {
  if (!error?.response) {
    setFormError(getMessageFromError(error));
    return;
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;

  if (code === "VALIDATION_ERROR" && Array.isArray(errorBody?.details)) {
    let mappedAny = false;
    for (const detail of errorBody.details) {
      if (detail?.field === "comment_text") {
        setError("comment_text", { type: "server", message: detail.message });
        mappedAny = true;
      }
    }
    if (mappedAny) return;
  }

  setFormError(getMessageFromError(error));
}

export function TaskCommentsSection({ taskId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const taskIdNum = Number(taskId);
  const isValidTaskId = Number.isInteger(taskIdNum) && taskIdNum > 0;

  const commentsQuery = useQuery({
    queryKey: ["task-comments", taskIdNum],
    queryFn: () => taskService.listComments(taskIdNum).then((result) => result.comments),
    enabled: isValidTaskId,
    retry: false,
  });

  const invalidateComments = () =>
    queryClient.invalidateQueries({ queryKey: ["task-comments", taskIdNum] });

  const createMutation = useMutation({
    mutationFn: (payload) => taskService.addComment(taskIdNum, payload),
    onSuccess: () => {
      invalidateComments();
      toast.success("Comment added.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, payload }) =>
      taskService.updateComment(taskIdNum, commentId, payload),
    onSuccess: () => {
      invalidateComments();
      toast.success("Comment updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => taskService.deleteComment(taskIdNum, commentId),
    onSuccess: () => {
      invalidateComments();
      toast.success("Comment deleted.");
    },
  });

  const handleAddComment = async (commentText, { setError, setFormError, reset }) => {
    try {
      await createMutation.mutateAsync({ comment_text: commentText });
      reset({ comment_text: "" });
    } catch (error) {
      mapFormErrors(error, { setError, setFormError });
    }
  };

  const handleUpdateComment = (commentId) => async (commentText, { setError, setFormError }) => {
    try {
      await updateMutation.mutateAsync({ commentId, payload: { comment_text: commentText } });
      setEditingCommentId(null);
    } catch (error) {
      mapFormErrors(error, { setError, setFormError });
    }
  };

  const handleDeleteComment = async (comment) => {
    const confirmed = window.confirm("Delete this comment? This action cannot be undone.");
    if (!confirmed) return;
    setDeletingCommentId(comment.comment_id);
    try {
      await deleteMutation.mutateAsync(comment.comment_id);
    } catch (error) {
      toast.error(getDeleteErrorMessage(error));
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (!isValidTaskId) {
    return null;
  }

  const comments = commentsQuery.data ?? [];
  const canModify = (comment) => {
    if (user?.role === "admin") return true;
    return user != null && Number(comment.user_id) === Number(user.user_id);
  };

  return (
    <section
      id="comments"
      aria-labelledby="task-comments-heading"
      className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="task-comments-heading"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900"
          >
            <MessageSquare className="h-5 w-5 text-primary-500" aria-hidden="true" />
            Comments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Share updates, questions, or notes about this task.
          </p>
        </div>
        {!commentsQuery.isLoading && !commentsQuery.isError && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        )}
      </header>

      <div className="mt-5 border-b border-gray-100 pb-5">
        <TaskCommentForm
          id="comment-add"
          label="Add a comment"
          submitLabel="Add comment"
          isSubmitting={createMutation.isPending}
          onSubmit={handleAddComment}
        />
      </div>

      <div className="mt-6">
        {commentsQuery.isLoading ? (
          <TaskCommentsSkeleton />
        ) : commentsQuery.isError ? (
          <ErrorState
            title="Couldn't load comments"
            description="Something went wrong while loading the comments. Please try again."
            onRetry={() => commentsQuery.refetch()}
          />
        ) : comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No comments yet"
            description="Be the first to leave a comment on this task."
          />
        ) : (
          <ul className="space-y-5">
            {comments.map((comment) => (
              <li key={comment.comment_id}>
                <TaskCommentItem
                  comment={comment}
                  isEditable={canModify(comment)}
                  isDeletable={canModify(comment)}
                  isEditing={editingCommentId === comment.comment_id}
                  isSaving={
                    updateMutation.isPending &&
                    updateMutation.variables?.commentId === comment.comment_id
                  }
                  isDeleting={deletingCommentId === comment.comment_id}
                  onStartEdit={() => setEditingCommentId(comment.comment_id)}
                  onCancelEdit={() => setEditingCommentId(null)}
                  onUpdate={handleUpdateComment(comment.comment_id)}
                  onDelete={() => handleDeleteComment(comment)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
