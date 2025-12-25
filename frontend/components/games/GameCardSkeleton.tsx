'use client';

interface GameCardSkeletonProps {
  count?: number;
}

export function GameCardSkeleton({ count = 6 }: GameCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative group bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-lg animate-pulse"
        >
          {/* Badge skeleton */}
          <div className="absolute top-6 right-6 z-10">
            <div className="h-8 w-16 bg-gray-300 rounded-full" />
          </div>

          {/* Icon skeleton */}
          <div className="p-8">
            <div className="w-16 h-16 bg-gray-300 rounded-2xl mb-4" />
            
            {/* Title skeleton */}
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2" />
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full" />
              <div className="h-4 bg-gray-300 rounded w-5/6" />
            </div>

            {/* Stats skeleton */}
            <div className="mt-6 flex gap-4">
              <div className="h-4 bg-gray-300 rounded w-20" />
              <div className="h-4 bg-gray-300 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
