import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

import { NOTIFICATION_TYPE_OPTIONS } from "./NotificationTypeIcon";

export function NotificationFilters({
  filters,
  onChange,
  onClear,
  canClear = false,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          id="notification-filter-read"
          label="Status"
          value={filters.is_read}
          onChange={(event) => onChange({ is_read: event.target.value })}
        >
          <option value="">All</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </Select>

        <Select
          id="notification-filter-type"
          label="Type"
          value={filters.notification_type}
          onChange={(event) =>
            onChange({ notification_type: event.target.value })
          }
        >
          <option value="">All types</option>
          {NOTIFICATION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Input
          id="notification-filter-project"
          label="Project ID"
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="Any"
          value={filters.project_id}
          onChange={(event) => onChange({ project_id: event.target.value })}
        />

        <Input
          id="notification-filter-task"
          label="Task ID"
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="Any"
          value={filters.task_id}
          onChange={(event) => onChange({ task_id: event.target.value })}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="secondary" onClick={onClear} disabled={!canClear}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
