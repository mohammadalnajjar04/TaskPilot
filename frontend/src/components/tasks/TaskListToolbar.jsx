import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { TASK_STATUS_OPTIONS } from "./TaskStatusBadge";
import {
  TASK_IMPORTANCE_OPTIONS,
  TASK_URGENCY_OPTIONS,
} from "./TaskPriorityBadge";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "due-asc", label: "Due date (soonest)" },
  { value: "due-desc", label: "Due date (latest)" },
  { value: "progress-high", label: "Progress (high to low)" },
  { value: "progress-low", label: "Progress (low to high)" },
];

export function TaskListToolbar({
  filters,
  projects = [],
  categories = [],
  assignedToOptions = [],
  createdByOptions = [],
  onChange,
  onClear,
  canClear = false,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="space-y-4">
        <Input
          id="task-search"
          label="Search tasks"
          type="search"
          placeholder="Search by task title..."
          value={filters.q}
          onChange={(event) => onChange({ q: event.target.value })}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Select
            id="task-filter-status"
            label="Status"
            value={filters.status}
            onChange={(event) => onChange({ status: event.target.value })}
          >
            <option value="">All</option>
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-filter-urgency"
            label="Urgency priority"
            value={filters.urgency_priority}
            onChange={(event) =>
              onChange({ urgency_priority: event.target.value })
            }
          >
            <option value="">All</option>
            {TASK_URGENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-filter-importance"
            label="Agile importance"
            value={filters.agile_importance}
            onChange={(event) =>
              onChange({ agile_importance: event.target.value })
            }
          >
            <option value="">All</option>
            {TASK_IMPORTANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-filter-project"
            label="Project"
            value={filters.project_id}
            onChange={(event) => onChange({ project_id: event.target.value })}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.project_key} — {project.project_name}
              </option>
            ))}
          </Select>

          <Select
            id="task-filter-category"
            label="Category"
            value={filters.category_id}
            onChange={(event) => onChange({ category_id: event.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.category_name}
              </option>
            ))}
          </Select>

          <Select
            id="task-filter-assigned"
            label="Assigned to"
            value={filters.assigned_to}
            onChange={(event) => onChange({ assigned_to: event.target.value })}
          >
            <option value="">Anyone</option>
            {assignedToOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="task-filter-created"
            label="Created by"
            value={filters.created_by}
            onChange={(event) => onChange({ created_by: event.target.value })}
          >
            <option value="">Anyone</option>
            {createdByOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(event) =>
                onChange({ overdue: event.target.checked ? "1" : "" })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500/40"
            />
            Overdue only
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-60">
              <Select
                id="task-sort"
                label="Sort by"
                value={filters.sort}
                onChange={(event) => onChange({ sort: event.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" onClick={onClear} disabled={!canClear}>
              Clear filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
