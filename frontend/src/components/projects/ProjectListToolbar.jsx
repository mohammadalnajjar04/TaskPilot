import { Search } from "lucide-react";

import { PROJECT_STATUS_OPTIONS } from "./ProjectStatusBadge";

const selectClasses =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

export function ProjectListToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search projects"
          placeholder="Search by key or name…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-medium text-gray-700">
            Status
          </span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className={selectClasses}
          >
            <option value="all">All statuses</option>
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-medium text-gray-700">
            Sort
          </span>
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            className={selectClasses}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="progress-high">Progress: high to low</option>
            <option value="progress-low">Progress: low to high</option>
          </select>
        </label>
      </div>
    </div>
  );
}
