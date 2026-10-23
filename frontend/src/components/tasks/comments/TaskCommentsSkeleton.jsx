export function TaskCommentsSkeleton() {
  return (
    <div role="status" aria-label="Loading comments" className="space-y-6">
      <div className="space-y-3">
        <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-5 animate-pulse rounded bg-gray-100" />
      </div>

      <ul className="space-y-5">
        {[0, 1, 2].map((index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
