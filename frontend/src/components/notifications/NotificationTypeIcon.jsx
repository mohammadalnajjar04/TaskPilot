import {
  AlarmClock,
  AlertOctagon,
  Bell,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  MessageSquare,
} from "lucide-react";

export const NOTIFICATION_TYPE_OPTIONS = [
  {
    value: "task_assigned",
    label: "Task assigned",
    icon: ListTodo,
    iconClassName: "bg-blue-100 text-blue-600",
  },
  {
    value: "deadline_approaching",
    label: "Deadline approaching",
    icon: AlarmClock,
    iconClassName: "bg-amber-100 text-amber-600",
  },
  {
    value: "task_overdue",
    label: "Task overdue",
    icon: AlertOctagon,
    iconClassName: "bg-red-100 text-red-600",
  },
  {
    value: "comment_added",
    label: "Comment added",
    icon: MessageSquare,
    iconClassName: "bg-violet-100 text-violet-600",
  },
  {
    value: "project_updated",
    label: "Project updated",
    icon: FolderKanban,
    iconClassName: "bg-cyan-100 text-cyan-600",
  },
  {
    value: "project_completed",
    label: "Project completed",
    icon: CheckCircle2,
    iconClassName: "bg-green-100 text-green-600",
  },
];

const FALLBACK_META = {
  label: "Notification",
  icon: Bell,
  iconClassName: "bg-gray-100 text-gray-600",
};

export function getNotificationTypeMeta(type) {
  return NOTIFICATION_TYPE_OPTIONS.find((option) => option.value === type) || FALLBACK_META;
}

export function NotificationTypeIcon({ type }) {
  const meta = getNotificationTypeMeta(type);
  const Icon = meta.icon;

  return (
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconClassName}`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
