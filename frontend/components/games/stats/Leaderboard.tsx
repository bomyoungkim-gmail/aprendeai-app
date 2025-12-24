'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalStars: number;
  avatarUrl?: string;
}

/**
 * Leaderboard component
 * Reuses existing table patterns from study-groups
 */
export function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games/leaderboard')
      .then(res => res.ok ? res.json() : { leaders: [] })
      .then(data => {
        setLeaders(data.leaders || []);
        setLoading(false);
      })
      .catch(() => {
        setLeaders([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-6 w-6 text-gray-300" />;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">🏆 Top Jogadores</h3>
        <span className="text-sm text-gray-500">{leaders.length} jogadores</span>
      </div>

      {leaders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum jogador ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaders.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-lg border ${getRankBg(entry.rank)} transition hover:shadow-md`}
            >
              {/* Rank Icon */}
              <div className="flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>

              {/* Rank Number */}
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-lg font-bold text-gray-700">
                  {entry.rank}
                </span>
              </div>

              {/* Avatar */}
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={entry.userName}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {entry.userName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {entry.userName}
                </p>
              </div>

              {/* Stars */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {entry.totalStars}
                </span>
                <span className="text-xl">⭐</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
