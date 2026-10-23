export function TaskAttachmentsSkeleton() {
  return (
    <div role="status" aria-label="Loading attachments" className="space-y-6">
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl border border-dashed border-gray-200 bg-gray-50" />
      </div>

      <ul className="space-y-3">
        {[0, 1, 2].map((index) => (
          <li key={index} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3.5">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-8 w-20 shrink-0 animate-pulse rounded-lg bg-gray-100" />
          </li>
        ))}
      </ul>
    </div>
  );
}
