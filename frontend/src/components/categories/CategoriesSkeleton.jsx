export function CategoriesSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6"
      role="status"
      aria-label="Loading categories"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
