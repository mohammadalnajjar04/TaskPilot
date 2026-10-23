export function TaskDetailsSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-6"
      role="status"
      aria-live="polite"
    >
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-8 w-72 max-w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-48 max-w-full animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-10 w-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl bg-gray-200 lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
