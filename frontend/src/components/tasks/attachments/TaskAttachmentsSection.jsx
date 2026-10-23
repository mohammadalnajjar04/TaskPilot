import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../../contexts/AuthContext";
import { taskService } from "../../../services/taskService";

import { EmptyState } from "../../common/EmptyState";
import { ErrorState } from "../../common/ErrorState";

import { TaskAttachmentItem } from "./TaskAttachmentItem";
import { TaskAttachmentsSkeleton } from "./TaskAttachmentsSkeleton";
import { TaskAttachmentUpload } from "./TaskAttachmentUpload";

const ACCEPT_TEXT = "JPEG, PNG, WebP, PDF, TXT, ZIP";

function getNetworkMessage(error) {
  return error?.code === "ECONNABORTED"
    ? "The request timed out. Please try again."
    : "Network error. Please check your connection and try again.";
}

function getUploadErrorMessage(error) {
  if (!error?.response) {
    return getNetworkMessage(error);
  }

  const errorBody = error.response.data?.error;
  const code = errorBody?.code;

  switch (code) {
    case "FILE_REQUIRED":
      return "Please choose a file to upload.";
    case "UNSUPPORTED_FILE_TYPE":
      return `Unsupported file type. Accepted types: ${ACCEPT_TEXT}.`;
    case "FILE_TOO_LARGE":
      return "The file is too large. Maximum size is 5 MB.";
    case "UPLOAD_ERROR":
      return errorBody?.message || "Upload failed. Please try again.";
    case "TASK_NOT_FOUND":
      return "This task no longer exists.";
    case "FORBIDDEN":
      return "You don't have permission to upload files to this task.";
    default:
      return errorBody?.message || "Upload failed. Please try again.";
  }
}

function getDeleteErrorMessage(error) {
  if (!error?.response) {
    return getNetworkMessage(error);
  }

  const errorBody = error.response.data?.error;
  switch (errorBody?.code) {
    case "ATTACHMENT_NOT_FOUND":
      return "This attachment no longer exists.";
    case "TASK_NOT_FOUND":
      return "This task no longer exists.";
    case "FORBIDDEN":
      return "You don't have permission to delete this attachment.";
    default:
      return errorBody?.message || "Something went wrong. Please try again.";
  }
}

export function TaskAttachmentsSection({ taskId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);

  const taskIdNum = Number(taskId);
  const isValidTaskId = Number.isInteger(taskIdNum) && taskIdNum > 0;

  const attachmentsQuery = useQuery({
    queryKey: ["task-attachments", taskIdNum],
    queryFn: () =>
      taskService.listAttachments(taskIdNum).then((result) => result.attachments),
    enabled: isValidTaskId,
    retry: false,
  });

  const invalidateAttachments = () =>
    queryClient.invalidateQueries({ queryKey: ["task-attachments", taskIdNum] });

  const uploadMutation = useMutation({
    mutationFn: (formData) => taskService.uploadAttachment(taskIdNum, formData),
    onSuccess: () => {
      invalidateAttachments();
      toast.success("Attachment uploaded.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId) => taskService.deleteAttachment(taskIdNum, attachmentId),
    onSuccess: () => {
      invalidateAttachments();
      toast.success("Attachment deleted.");
    },
  });

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadMutation.mutateAsync(formData);
      return null;
    } catch (error) {
      return getUploadErrorMessage(error);
    }
  };

  const handleDelete = async (attachment) => {
    const confirmed = window.confirm(
      `Delete attachment "${attachment.file_name}"? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    setDeletingAttachmentId(attachment.attachment_id);
    try {
      await deleteMutation.mutateAsync(attachment.attachment_id);
    } catch (error) {
      toast.error(getDeleteErrorMessage(error));
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  if (!isValidTaskId) {
    return null;
  }

  const attachments = attachmentsQuery.data ?? [];
  const canDelete = (attachment) => {
    if (user?.role === "admin") return true;
    return user != null && Number(attachment.uploaded_by) === Number(user.user_id);
  };

  return (
    <section
      id="attachments"
      aria-labelledby="task-attachments-heading"
      className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="task-attachments-heading"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900"
          >
            <Paperclip className="h-5 w-5 text-primary-500" aria-hidden="true" />
            Attachments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload files to share context with the team.
          </p>
        </div>
        {!attachmentsQuery.isLoading && !attachmentsQuery.isError && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {attachments.length} {attachments.length === 1 ? "file" : "files"}
          </span>
        )}
      </header>

      <div className="mt-5">
        <TaskAttachmentUpload isUploading={uploadMutation.isPending} onUpload={handleUpload} />
      </div>

      <div className="mt-6">
        {attachmentsQuery.isLoading ? (
          <TaskAttachmentsSkeleton />
        ) : attachmentsQuery.isError ? (
          <ErrorState
            title="Couldn't load attachments"
            description="Something went wrong while loading the attachments. Please try again."
            onRetry={() => attachmentsQuery.refetch()}
          />
        ) : attachments.length === 0 ? (
          <EmptyState
            icon={Paperclip}
            title="No attachments yet"
            description="Upload files above to attach them to this task."
          />
        ) : (
          <ul className="space-y-3">
            {attachments.map((attachment) => (
              <li key={attachment.attachment_id}>
                <TaskAttachmentItem
                  attachment={attachment}
                  canDelete={canDelete(attachment)}
                  isDeleting={deletingAttachmentId === attachment.attachment_id}
                  onDelete={() => handleDelete(attachment)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
