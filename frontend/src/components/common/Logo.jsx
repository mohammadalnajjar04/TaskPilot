import { ListChecks } from "lucide-react";

export function Logo({ tagline = false }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
        <ListChecks className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-semibold tracking-tight text-gray-900">
          TaskPilot
        </span>
        {tagline && (
          <span className="block text-xs text-gray-400">
            Take control of your day
          </span>
        )}
      </span>
    </span>
  );
}
