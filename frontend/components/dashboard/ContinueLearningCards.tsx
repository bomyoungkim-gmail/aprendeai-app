'use client';

import Link from 'next/link';
import { PlayCircle, Clock, FileText, Image as ImageIcon, Video, Headphones } from 'lucide-react';
import { useRecommendations } from '@/hooks/content/use-recommendations';

const typeIcons = {
  TEXT: FileText,
  PDF: FileText,
  DOCX: FileText,
  IMAGE: ImageIcon,
  VIDEO: Video,
  AUDIO: Headphones,
};

interface ContinueLearningItem {
  id: string;
  title: string;
  type: string;
  progress?: number;
}

export function ContinueLearningCards() {
  const { data, isLoading } = useRecommendations();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const continueItems = data?.continueReading || [];

  if (continueItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No content in progress. Start reading something new!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {continueItems.map((item: ContinueLearningItem) => (
        <ContinueLearningCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ContinueLearningCard({ item }: { item: ContinueLearningItem }) {
  const TypeIcon = typeIcons[item.type as keyof typeof typeIcons] || FileText;

  return (
    <Link
      href={`/reader/${item.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-500 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <TypeIcon className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {item.title}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <PlayCircle className="h-3 w-3" />
            <span>Continue from {item.progress || 0}%</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full transition-all"
                style={{ width: `${item.progress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-1.5 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
