'use client';

import { useGameProgress } from '@/hooks/games/use-game-progress';
import { GameStatsCard } from './GameStatsCard';
import { StarsPerGameChart } from './StarsPerGameChart';
import { Leaderboard } from './Leaderboard';

// Game ID to name mapping
const GAME_NAMES: Record<string, string> = {
  'FREE_RECALL_SCORE': 'Resumo',
  'CLOZE_SPRINT': 'Complete',
  'SRS_ARENA': 'Arena',
  'BOSS_FIGHT_VOCAB': 'Boss Fight',
  'CONCEPT_LINKING': 'Taboo',
  'FEYNMAN_TEACHER': 'Feynman',
  'ANALOGY_MAKER': 'Analogias',
  'SITUATION_SIM': 'Simulador',
  'PROBLEM_SOLVER': 'Quiz',
  'WHAT_IF_SCENARIO': 'E Se?',
  'DEBATE_MASTER': 'Debate',
  'SOCRATIC_DEFENSE': 'Socrático',
  'TOOL_WORD_HUNT': 'Caça-Palavras',
  'MISCONCEPTION_HUNT': 'Caçador',
  'RECOMMENDATION_ENGINE': 'Recomendações',
};

/**
 * Complete game dashboard with stats
 * Combines multiple visualizations
 */
export function GameDashboard() {
  const { progress, loading } = useGameProgress();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Erro ao carregar estatísticas</p>
      </div>
    );
  }

  const avgScore = progress.gamesProgress.length > 0
    ? progress.gamesProgress.reduce((sum, p) => sum + p.bestScore, 0) / progress.gamesProgress.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <GameStatsCard
        totalStars={progress.totalStars}
        currentStreak={progress.currentStreak}
        gamesPlayed={progress.totalGamesPlayed}
        avgScore={Math.round(avgScore)}
      />

      {/* Charts and Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stars Chart */}
        <StarsPerGameChart
          gamesProgress={progress.gamesProgress}
          gameNames={GAME_NAMES}
        />

        {/* Leaderboard */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
