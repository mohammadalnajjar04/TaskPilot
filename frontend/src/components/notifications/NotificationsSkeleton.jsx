export function NotificationsSkeleton() {
  return (
    <div role="status" aria-label="Loading notifications" className="space-y-5">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
      </div>

      <ul className="space-y-3">
        {[0, 1, 2, 3].map((index) => (
          <li
            key={index}
            className="rounded-xl border border-gray-100 bg-white p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-8 w-16 shrink-0 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
