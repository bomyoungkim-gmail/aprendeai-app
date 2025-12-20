'use client';

import Link from 'next/link';
import { 
  PlayCircle, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Flame, 
  FileText,
  Image as ImageIcon,
  Video,
  Headphones 
} from 'lucide-react';
import { useRecommendations } from '@/hooks/use-recommendations';

const typeIcons = {
  TEXT: FileText,
  PDF: FileText,
  DOCX: FileText,
  IMAGE: ImageIcon,
  VIDEO: Video,
  AUDIO: Headphones,
};

export function RecommendationsSection() {
  const { data, isLoading } = useRecommendations();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data) return null;

  const sections = [
    {
      key: 'continueReading',
      title: 'Continue Reading',
      icon: PlayCircle,
      items: data.continueReading,
      showProgress: true,
      color: 'text-blue-600',
    },
    {
      key: 'recentReads',
      title: 'Recent Reads',
      icon: Clock,
      items: data.recentReads,
      color: 'text-gray-600',
    },
    {
      key: 'popularInGroups',
      title: 'Popular in Your Groups',
      icon: TrendingUp,
      items: data.popularInGroups,
      color: 'text-green-600',
    },
    {
      key: 'similar',
      title: 'You Might Like',
      icon: Sparkles,
      items: data.similar,
      color: 'text-purple-600',
    },
    {
      key: 'trending',
      title: 'Trending Now',
      icon: Flame,
      items: data.trending,
      color: 'text-orange-600',
    },
  ];

  // Filter out empty sections
  const nonEmptySections = sections.filter((section) => section.items.length > 0);

  if (nonEmptySections.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No recommendations yet. Start reading content to get personalized suggestions!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {nonEmptySections.map((section) => (
        <RecommendationGroup
          key={section.key}
          title={section.title}
          icon={section.icon}
          items={section.items}
          showProgress={section.showProgress}
          color={section.color}
        />
      ))}
    </div>
  );
}

interface RecommendationGroupProps {
  title: string;
  icon: React.ElementType;
  items: any[];
  showProgress?: boolean;
  color?: string;
}

function RecommendationGroup({
  title,
  icon: Icon,
  items,
  showProgress,
  color = 'text-gray-600',
}: RecommendationGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">({items.length})</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <RecommendationCard
            key={item.id}
            content={item}
            showProgress={showProgress}
          />
        ))}
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  content: any;
  showProgress?: boolean;
}

function RecommendationCard({ content, showProgress }: RecommendationCardProps) {
  const TypeIcon = typeIcons[content.type as keyof typeof typeIcons] || FileText;

  return (
    <Link
      href={`/reader/${content.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-500 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <TypeIcon className="h-5 w-5 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {content.title}
          </h4>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-gray-100 rounded">
              {content.type}
            </span>
            {content.ownerUser && (
              <span>by {content.ownerUser.name}</span>
            )}
          </div>

          {showProgress && content.progress !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{content.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${content.progress}%` }}
                />
              </div>
            </div>
          )}

          {content.popularity !== undefined && (
            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
              <Flame className="h-3 w-3" />
              <span>Popular</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
