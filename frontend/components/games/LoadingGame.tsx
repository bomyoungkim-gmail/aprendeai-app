import { ArrowRight, Trophy, X } from 'lucide-react';

export function LoadingGame() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
        <div>
          <div className="h-6 w-32 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="h-3 w-10 bg-gray-200 rounded mb-1 ml-auto"></div>
            <div className="h-6 w-8 bg-gray-200 rounded ml-auto"></div>
          </div>
          <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-6 space-y-6">
        {/* Game Area Box */}
        <div className="bg-gray-50 border border-gray-100 p-6 rounded-lg space-y-4">
          <div className="h-4 w-full bg-gray-200 rounded opacity-70"></div>
          <div className="h-8 w-3/4 bg-gray-200 rounded mx-auto"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded mx-auto opacity-70"></div>
          
          <div className="flex gap-2 justify-center mt-4">
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Input/Interaction Area */}
        <div className="h-40 bg-gray-50 border border-gray-100 rounded-lg"></div>

        {/* Button */}
        <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
      </div>
    </div>
  );
}
