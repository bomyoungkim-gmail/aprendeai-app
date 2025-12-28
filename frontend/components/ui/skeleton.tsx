export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className}`}></div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg p-5">
      <div className="flex items-center">
        <Skeleton className="h-12 w-12 rounded-md" />
        <div className="ml-5 flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton className="h-4 w-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {[1, 2, 3, 4, 5].map((j) => (
                <td key={j} className="px-6 py-4">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
