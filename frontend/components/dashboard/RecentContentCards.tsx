'use client';

import Link from 'next/link';
import { Clock, FileText, Image as ImageIcon, Video, Headphones } from 'lucide-react';
import { useRecommendations } from '@/hooks/use-recommendations';

const typeIcons = {
  TEXT: FileText,
  PDF: FileText,
  DOCX: FileText,
  IMAGE: ImageIcon,
  VIDEO: Video,
  AUDIO: Headphones,
};

export function RecentContentCards() {
  const { data, isLoading } = useRecommendations();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const recentItems = data?.recentReads?.slice(0, 6) || [];

  if (recentItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent content. Start exploring!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {recentItems.map((item) => (
        <RecentContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function RecentContentCard({ item }: { item: any }) {
  const TypeIcon = typeIcons[item.type as keyof typeof typeIcons] || FileText;

  return (
    <Link
      href={`/reader/${item.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-500 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          <TypeIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {item.title}
          </h3>

          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Recently read</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
