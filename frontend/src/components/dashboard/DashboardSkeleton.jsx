export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="space-y-8">
      <div>
        <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-2 w-full animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-3 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-2 w-full animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
