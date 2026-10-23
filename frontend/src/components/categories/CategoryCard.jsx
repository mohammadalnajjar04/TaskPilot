import { Loader2, Pencil, Trash2 } from "lucide-react";

import { CategoryColorPreview } from "./CategoryColorPreview";

const actionButtonClasses =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60";

const dangerButtonClasses =
  "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-60";

function formatDate(value) {
  if (!value) return "Unknown";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "Unknown";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CategoryCard({ category, isDeleting = false, onEdit, onDelete }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <CategoryColorPreview
          color={category.color}
          label={`${category.category_name} color`}
        />
        <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900">
          {category.category_name}
        </h3>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Created {formatDate(category.created_at)}
      </p>

      <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4">
        <button type="button" onClick={onEdit} className={actionButtonClasses}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className={dangerButtonClasses}
        >
          {isDeleting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
