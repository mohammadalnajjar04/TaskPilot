import { Loader2 } from "lucide-react";

export function RouteLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] w-full items-center justify-center"
    >
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading...
      </p>
    </div>
  );
}
