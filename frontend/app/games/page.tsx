'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { GamePlayer } from '@/components/games/GamePlayer';
import { 
  Zap, 
  Brain, 
  Target, 
  Swords,
  Search,
  ShieldQuestion,
  Trophy,
  Star,
  Lock,
  Lightbulb,
  Book,
  Puzzle,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Flame
} from 'lucide-react';

// Dynamic icon mapping for all 15 games
const GAME_ICONS: Record<string, any> = {
  // Phase 1
  'FREE_RECALL_SCORE': Brain,
  'CLOZE_SPRINT': Zap,
  'SRS_ARENA': Target,
  // Phase 2
  'FEYNMAN_TEACHER': Book,
  'CONCEPT_LINKING': Puzzle,
  'ANALOGY_MAKER': Lightbulb,
  // Phase 3
  'SITUATION_SIM': Sparkles,
  'PROBLEM_SOLVER': Flame,
  'WHAT_IF_SCENARIO': HelpCircle,
  // Phase 4
  'BOSS_FIGHT_VOCAB': Swords,
  'DEBATE_MASTER': MessageSquare,
  'SOCRATIC_DEFENSE': MessageSquare,
  // Phase 5
  'TOOL_WORD_HUNT': Search,
  'MISCONCEPTION_HUNT': ShieldQuestion,
  'RECOMMENDATION_ENGINE': Target,
};

// Gradient mapping for visual appeal
const GAME_GRADIENTS: Record<string, string> = {
  'FREE_RECALL_SCORE': 'from-blue-500 to-cyan-600',
  'CLOZE_SPRINT': 'from-purple-500 to-pink-600',
  'SRS_ARENA': 'from-green-500 to-teal-600',
  'FEYNMAN_TEACHER': 'from-yellow-500 to-orange-500',
  'CONCEPT_LINKING': 'from-indigo-500 to-purple-600',
  'ANALOGY_MAKER': 'from-pink-500 to-rose-600',
  'SITUATION_SIM': 'from-teal-500 to-cyan-600',
  'PROBLEM_SOLVER': 'from-red-500 to-orange-600',
  'WHAT_IF_SCENARIO': 'from-blue-600 to-indigo-600',
  'BOSS_FIGHT_VOCAB': 'from-red-500 to-orange-600',
  'DEBATE_MASTER': 'from-violet-500 to-purple-600',
  'SOCRATIC_DEFENSE': 'from-fuchsia-500 to-pink-600',
  'TOOL_WORD_HUNT': 'from-indigo-500 to-blue-600',
  'MISCONCEPTION_HUNT': 'from-yellow-500 to-orange-600',
  'RECOMMENDATION_ENGINE': 'from-green-500 to-emerald-600',
};

interface Game {
  id: string;
  name: string;
  difficulty_range: [number, number];
  duration_min: number;
  requires_content: boolean;
  game_intent: string;
}

export default function GamesPage() {
  const user = useAuthStore((state) => state.user);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    // Fetch games dynamically from API
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        setGames(data.games);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch games:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          🎮 Centro de Jogos
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Aprenda de forma divertida e interativa com nossos {games.length} jogos pedagógicos.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          icon={Trophy}
          label="Total de Estrelas"
          value="0"
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatsCard
          icon={Star}
          label="Streak Atual"
          value="0"
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatsCard
          icon={Target}
          label="Jogos Completos"
          value="0"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      {/* Games Grid - DYNAMIC */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={() => setSelectedGame(game.id)}
            selected={selectedGame === game.id}
          />
        ))}
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className={`${bgColor} rounded-lg border border-gray-200 p-5`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function GameCard({ 
  game, 
  progress,
  onSelect, 
  selected 
}: { 
  game: Game; 
  progress: GameProgress | null;
  onSelect: () => void; 
  selected: boolean 
}) {
  const Icon = GAME_ICONS[game.id] || Brain;
  const gradient = GAME_GRADIENTS[game.id] || 'from-gray-500 to-gray-600';
  const unlocked = true; // All games unlocked for now

  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      className={`
        relative overflow-hidden rounded-xl 
        transition-all duration-200 ease-in-out
        ${selected 
          ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' 
          : 'hover:scale-105'
        }
        ${!unlocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        bg-gradient-to-br ${gradient} 
        text-white shadow-lg hover:shadow-xl
        p-6 text-left
      `}
    >
      {/* Lock Overlay */}
      {!unlocked && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <Lock className="h-12 w-12 text-white" />
        </div>
      )}

      {/* Stars Display */}
      {progress && progress.stars > 0 && (
        <div className="absolute top-3 right-3 flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="text-lg">
              {i < progress.stars ? '⭐' : '☆'}
            </span>
          ))}
        </div>
      )}

      {/* Icon */}
      <div className="mb-3">
        <Icon className="h-10 w-10" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold mb-1">{game.name}</h3>

      {/* Description */}
      <p className="text-sm text-white/90 mb-4 line-clamp-2">
        {game.game_intent}
      </p>

      {/* Progress Stats */}
      {progress && progress.totalPlays > 0 && (
        <div className="mb-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-white/80">Melhor Score:</span>
            <span className="font-bold">{Math.round(progress.bestScore)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/80">Jogadas:</span>
            <span className="font-bold">{progress.totalPlays}</span>
          </div>
          {progress.streak > 0 && (
            <div className="flex justify-between">
              <span className="text-white/80">Streak:</span>
              <span className="font-bold">🔥 {progress.streak}</span>
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs">
        <span className="bg-white/20 px-2 py-1 rounded-full">
          {game.duration_min}min
        </span>
        <span className="flex items-center">
          {'⭐'.repeat(game.difficulty_range[1])}
        </span>
      </div>

      {/* Coming Soon Badge */}
      {!unlocked && (
        <div className="absolute top-3 right-3 bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">
          Em Breve
        </div>
      )}
    </button>
  );
}
