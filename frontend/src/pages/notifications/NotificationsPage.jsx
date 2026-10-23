import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, SearchX } from "lucide-react";
import { toast } from "react-hot-toast";

import { notificationService } from "../../services/notificationService";

import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { NotificationFilters } from "../../components/notifications/NotificationFilters";
import { NotificationItem } from "../../components/notifications/NotificationItem";
import { NotificationsSkeleton } from "../../components/notifications/NotificationsSkeleton";

function getActionErrorMessage(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }

  const errorBody = error.response.data?.error;
  switch (errorBody?.code) {
    case "NOTIFICATION_NOT_FOUND":
      return "This notification no longer exists.";
    case "FORBIDDEN":
      return "You don't have permission to do that.";
    case "VALIDATION_ERROR":
      return errorBody?.message || "The request is invalid. Please try again.";
    default:
      return errorBody?.message || "Something went wrong. Please try again.";
  }
}

function getDeleteErrorMessage(error) {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Network error. Please check your connection and try again.";
  }

  const errorBody = error.response.data?.error;
  if (errorBody?.code === "NOTIFICATION_NOT_FOUND") {
    return "This notification no longer exists.";
  }
  return errorBody?.message || "Something went wrong. Please try again.";
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [deletingNotificationId, setDeletingNotificationId] = useState(null);

  const isReadParam = searchParams.get("is_read") || "";
  const typeParam = searchParams.get("notification_type") || "";
  const projectIdParam = searchParams.get("project_id") || "";
  const taskIdParam = searchParams.get("task_id") || "";

  const filters = {
    is_read: isReadParam,
    notification_type: typeParam,
    project_id: projectIdParam,
    task_id: taskIdParam,
  };

  const serverFilters = useMemo(() => {
    const result = {};
    if (isReadParam === "true") result.is_read = true;
    if (isReadParam === "false") result.is_read = false;
    if (typeParam) result.notification_type = typeParam;
    if (/^\d+$/.test(projectIdParam)) result.project_id = Number(projectIdParam);
    if (/^\d+$/.test(taskIdParam)) result.task_id = Number(taskIdParam);
    return result;
  }, [isReadParam, typeParam, projectIdParam, taskIdParam]);

  const hasActiveFilters = Boolean(
    filters.is_read || filters.notification_type || filters.project_id || filters.task_id
  );

  const patchParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const notificationsQuery = useQuery({
    queryKey: ["notifications", serverFilters],
    queryFn: () =>
      notificationService.list(serverFilters).then((result) => result.notifications),
    retry: false,
  });

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      notificationService.unreadCount().then((result) => result.unread_count),
    retry: false,
  });

  const unreadCount = unreadCountQuery.data ?? 0;

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markReadMutation = useMutation({
    mutationFn: (notificationId) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      invalidateNotifications();
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (result) => {
      invalidateNotifications();
      const count = result?.updated_count;
      toast.success(
        count > 0
          ? `${count} notification${count === 1 ? "" : "s"} marked as read.`
          : "You're all caught up."
      );
    },
    onError: (error) => {
      toast.error(getActionErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId) => notificationService.delete(notificationId),
    onSuccess: () => {
      invalidateNotifications();
      toast.success("Notification deleted.");
    },
  });

  const handleMarkAsRead = async (notification) => {
    setMarkingNotificationId(notification.notification_id);
    try {
      await markReadMutation.mutateAsync(notification.notification_id);
    } catch (error) {
      toast.error(getActionErrorMessage(error));
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllMutation.mutate();
  };

  const handleDelete = async (notification) => {
    const confirmed = window.confirm(
      `Delete this notification? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    setDeletingNotificationId(notification.notification_id);
    try {
      await deleteMutation.mutateAsync(notification.notification_id);
    } catch (error) {
      toast.error(getDeleteErrorMessage(error));
    } finally {
      setDeletingNotificationId(null);
    }
  };

  const notifications = notificationsQuery.data ?? [];
  const hasNoNotifications = notifications.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span
                className="rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-semibold text-white"
                title={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
              >
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Stay up to date on tasks, projects, and team activity.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            loading={markAllMutation.isPending}
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark all as read
          </Button>
        )}
      </header>

      <NotificationFilters
        filters={filters}
        onChange={patchParams}
        onClear={clearFilters}
        canClear={hasActiveFilters}
      />

      {notificationsQuery.isLoading ? (
        <NotificationsSkeleton />
      ) : notificationsQuery.isError ? (
        <ErrorState
          title="Couldn't load notifications"
          description="Something went wrong while loading your notifications. Please try again."
          onRetry={() => notificationsQuery.refetch()}
        />
      ) : hasNoNotifications && !hasActiveFilters ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Notifications about tasks, projects, and team activity will appear here."
        />
      ) : hasNoNotifications ? (
        <EmptyState
          icon={SearchX}
          title="No notifications match filters"
          description="Try adjusting your filters to see more notifications."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <section aria-labelledby="notifications-list-heading">
          <h2 id="notifications-list-heading" className="sr-only">
            Notifications
          </h2>
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li key={notification.notification_id}>
                <NotificationItem
                  notification={notification}
                  isMarking={markingNotificationId === notification.notification_id}
                  isDeleting={deletingNotificationId === notification.notification_id}
                  onMarkAsRead={() => handleMarkAsRead(notification)}
                  onDelete={() => handleDelete(notification)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default NotificationsPage;
