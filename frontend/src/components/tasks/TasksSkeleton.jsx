export function TasksSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6"
      role="status"
      aria-label="Loading tasks"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
