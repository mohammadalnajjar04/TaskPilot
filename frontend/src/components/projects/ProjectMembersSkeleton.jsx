export function ProjectMembersSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-4xl space-y-6"
      role="status"
      aria-label="Loading project members"
    >
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

      <div className="space-y-2">
        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-200" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="mt-4 h-10 w-32 animate-pulse rounded-lg bg-gray-100" />
      </div>

      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-20 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-20 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
