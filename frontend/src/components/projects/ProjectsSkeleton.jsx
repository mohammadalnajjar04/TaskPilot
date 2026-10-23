export function ProjectsSkeleton() {
  return (
    <div role="status" aria-label="Loading projects" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <div className="h-14 animate-pulse rounded-xl bg-gray-200" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
            </div>
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 h-2 w-full animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-3 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
