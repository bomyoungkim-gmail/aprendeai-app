'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Calendar, BookOpen, Users, AlertCircle } from 'lucide-react';
import ROUTES from '@/lib/api-routes';

interface ContextCardsContainerProps {
  userId: string;
}

interface ContextCard {
  id: string;
  type: 'CO_READING' | 'REVIEW_DUE' | 'WEEKLY_PLAN' | 'STREAK_ALERT';
  title: string;
  message: string;
  ctaText: string;
  ctaUrl: string;
  icon?: string;
  color?: string;
}

export function ContextCardsContainer({ userId }: ContextCardsContainerProps) {
  const { data: cards, isLoading } = useQuery<ContextCard[]>({
    queryKey: ['context-cards', userId],
    queryFn: async () => {
      const response = await fetch(ROUTES.OPS.CONTEXT_CARDS, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading || !cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <ContextCard key={card.id} card={card} />
      ))}
    </div>
  );
}

function ContextCard({ card }: { card: ContextCard }) {
  const iconMap = {
    CO_READING: Calendar,
    REVIEW_DUE: BookOpen,
    WEEKLY_PLAN: Calendar,
    STREAK_ALERT: AlertCircle,
  };

  const colorMap = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200',
  };

  const Icon = iconMap[card.type] || AlertCircle;
  const bgColor = colorMap[card.color as keyof typeof colorMap] || colorMap.blue;

  return (
    <div className={`rounded-lg border-2 p-5 ${bgColor} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-gray-700" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {card.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {card.message}
          </p>
          
          <div className="flex items-center gap-3">
            <Link
              href={card.ctaUrl}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {card.ctaText}
            </Link>
            
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Remind Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
