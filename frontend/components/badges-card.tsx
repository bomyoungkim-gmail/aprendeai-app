import React from 'react';
import { Award, Trophy, Star, Zap } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  category?: string;
}

interface UserBadge {
  badge_id: string;
  awarded_at: string;
  badges: Badge;
}

interface BadgesCardProps {
  badges: UserBadge[];
  totalBadges?: number;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  streak: <Zap className="h-6 w-6" />,
  achievement: <Trophy className="h-6 w-6" />,
  milestone: <Star className="h-6 w-6" />,
  default: <Award className="h-6 w-6" />,
};

export function BadgesCard({ badges, totalBadges }: BadgesCardProps) {
  const displayedBadges = badges.slice(0, 3); // Show top 3 recent badges
  const hasMore = badges.length > 3;

  return (
    <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conquistas
            </h3>
          </div>
          {totalBadges !== undefined && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {badges.length}/{totalBadges}
            </span>
          )}
        </div>

        {/* Badges Grid */}
        {displayedBadges.length > 0 ? (
          <div className="space-y-3">
            {displayedBadges.map((userBadge) => {
              const badge = userBadge.badges;
              const icon = BADGE_ICONS[badge.category || 'default'] || BADGE_ICONS.default;
              const awardedDate = new Date(userBadge.awarded_at);
              const daysAgo = Math.floor(
                (Date.now() - awardedDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={userBadge.badge_id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {badge.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {badge.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {daysAgo === 0
                        ? 'Hoje'
                        : daysAgo === 1
                        ? 'Ontem'
                        : `Há ${daysAgo} dias`}
                    </p>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <button className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium py-2">
                Ver todas ({badges.length})
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma conquista ainda
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Continue estudando para desbloquear badges!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
