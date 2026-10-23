export function TaskFormSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading task form">
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
      </div>

      <div className="space-y-4">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}
