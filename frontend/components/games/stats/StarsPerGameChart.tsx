'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GameProgress {
  gameId: string;
  stars: number;
  bestScore: number;
  totalPlays: number;
}

interface StarsPerGameChartProps {
  gamesProgress: GameProgress[];
  gameNames: Record<string, string>; // Map gameId -> name
}

/**
 * Bar chart showing stars earned per game
 * Uses recharts library
 */
export function StarsPerGameChart({ gamesProgress, gameNames }: StarsPerGameChartProps) {
  // Transform data for chart
  const chartData = gamesProgress
    .filter(p => p.totalPlays > 0) // Only show played games
    .map(p => ({
      name: gameNames[p.gameId] || p.gameId,
      stars: p.stars,
      plays: p.totalPlays,
    }))
    .sort((a, b) => b.stars - a.stars) // Sort by stars desc
    .slice(0, 10); // Top 10

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Jogue alguns jogos para ver suas estatísticas!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">⭐ Estrelas por Jogo</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey="stars" fill="#FFD700" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
