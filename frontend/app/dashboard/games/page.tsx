'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import { gamesApi } from '@/lib/api/games';
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
  Flame,
  Users,
  User,
  Bot
} from 'lucide-react';

// Player mode mapping
const GAME_PLAYER_MODES: Record<string, 'solo' | 'multiplayer' | 'ai-chat'> = {
  // Solo games (15)
  'FREE_RECALL_SCORE': 'solo',
  'CLOZE_SPRINT': 'solo',
  'SRS_ARENA': 'solo',
  'FEYNMAN_TEACHER': 'solo',
  'CONCEPT_LINKING': 'solo',
  'ANALOGY_MAKER': 'solo',
  'SITUATION_SIM': 'solo',
  'PROBLEM_SOLVER': 'solo',
  'WHAT_IF_SCENARIO': 'solo',
  'BOSS_FIGHT_VOCAB': 'solo',
  'DEBATE_MASTER': 'solo',
  'SOCRATIC_DEFENSE': 'solo',
  'TOOL_WORD_HUNT': 'solo',
  'MISCONCEPTION_HUNT': 'solo',
  'RECOMMENDATION_ENGINE': 'solo',
  // Multiplayer (1)
  'DUEL_DEBATE': 'multiplayer',
  // AI Chat (1)
  'ROLEPLAY_DISCOVERY': 'ai-chat',
};

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

interface GameProgress {
  stars: number;
  bestScore: number;
  totalPlays: number;
  streak: number;
}

// Fallback games if API fails
const FALLBACK_GAMES: Game[] = [
  { id: 'FREE_RECALL_SCORE', name: 'Resumo Livre', difficulty_range: [1, 3], duration_min: 5, requires_content: true, game_intent: 'Teste sua memória recordando conceitos sem ajuda' },
  { id: 'CLOZE_SPRINT', name: 'Sprint de Lacunas', difficulty_range: [2, 3], duration_min: 10, requires_content: true, game_intent: 'Complete frases rapidamente para fixar conteúdo' },
  { id: 'SRS_ARENA', name: 'Arena SRS', difficulty_range: [1, 4], duration_min: 15, requires_content: true, game_intent: 'Sistema de repetição espaçada adaptativo' },
  { id: 'FEYNMAN_TEACHER', name: 'Professor Feynman', difficulty_range: [2, 4], duration_min: 10, requires_content: true, game_intent: 'Explique conceitos com suas próprias palavras' },
  { id: 'CONCEPT_LINKING', name: 'Taboo de Conceitos', difficulty_range: [2, 3], duration_min: 8, requires_content: true, game_intent: 'Conecte conceitos relacionados visualmente'  },
  { id: 'ANALOGY_MAKER', name: 'Criador de Analogias', difficulty_range: [3, 4], duration_min: 10, requires_content: true, game_intent: 'Crie analogias criativas para conceitos complexos' },
  { id: 'SITUATION_SIM', name: 'Simulador de Situações', difficulty_range: [3, 5], duration_min: 15, requires_content: true, game_intent: 'Simule situações reais aplicando conhecimento' },
  { id: 'PROBLEM_SOLVER', name: 'Solucionador de Problemas', difficulty_range: [3, 5], duration_min: 20, requires_content: true, game_intent: 'Resolva problemas práticos passo a passo' },
  { id: 'WHAT_IF_SCENARIO', name: 'Cenário E Se?', difficulty_range: [3, 4], duration_min: 12, requires_content: true, game_intent: 'Explore cenários hipotéticos e consequências' },
  { id: 'BOSS_FIGHT_VOCAB', name: 'Boss Fight de Vocabulário', difficulty_range: [2, 5], duration_min: 10, requires_content: true, game_intent: 'Batalhe contra chefes usando vocabulário' },
  { id: 'DEBATE_MASTER', name: 'Mestre do Debate', difficulty_range: [4, 5], duration_min: 15, requires_content: true, game_intent: 'Defenda argumentos em debates estruturados' },
  { id: 'DUEL_DEBATE', name: 'Duelo de Debates', difficulty_range: [4, 5], duration_min: 15, requires_content: true, game_intent: 'Debata contra oponentes em duelos argumentativos' },
  { id: 'SOCRATIC_DEFENSE', name: 'Defesa Socrática', difficulty_range: [4, 5], duration_min: 15, requires_content: true, game_intent: 'Responda perguntas socráticas profundas' },
  { id: 'TOOL_WORD_HUNT', name: 'Caça-Palavras Analítico', difficulty_range: [1, 2], duration_min: 5, requires_content: true, game_intent: 'Encontre palavras-chave rapidamente' },
  { id: 'MISCONCEPTION_HUNT', name: 'Caçador de Erros', difficulty_range: [3, 4], duration_min: 10, requires_content: true, game_intent: 'Identifique e corrija conceitos errados' },
  { id: 'RECOMMENDATION_ENGINE', name: 'Motor de Recomendações', difficulty_range: [2, 4], duration_min: 5, requires_content: true, game_intent: 'Receba recomendações personalizadas de estudo' },
  { id: 'ROLEPLAY_DISCOVERY', name: 'Desafio de Roleplay', difficulty_range: [3, 5], duration_min: 15, requires_content: true, game_intent: 'Assuma papéis e descubra conceitos na prática' },
];

export default function GamesPage() {
  const user = useAuthStore((state) => state.user);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'solo' | 'multiplayer' | 'ai-chat'>('all');

  useEffect(() => {
    // Fetch games dynamically from API
    api.get(API_ENDPOINTS.GAMES.CATALOG)
      .then(res => {
        console.log('Games API response:', res.data);
        if (res.data.games && res.data.games.length > 0) {
          setGames(res.data.games);
        } else {
          console.warn('No games from API, using fallback');
          setGames(FALLBACK_GAMES);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch games, using fallback:', err);
        setError('Usando jogos offline');
        setGames(FALLBACK_GAMES);
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

  // Filter games
  const filteredGames = games.filter(game => {
    if (filter === 'all') return true;
    return GAME_PLAYER_MODES[game.id] === filter;
  });

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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Todos ({games.length})
        </button>
        <button
          onClick={() => setFilter('solo')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'solo'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="h-4 w-4" />
          Solo ({games.filter(g => GAME_PLAYER_MODES[g.id] === 'solo').length})
        </button>
        <button
          onClick={() => setFilter('multiplayer')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'multiplayer'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4" />
          Multiplayer ({games.filter(g => GAME_PLAYER_MODES[g.id] === 'multiplayer').length})
        </button>
        <button
          onClick={() => setFilter('ai-chat')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'ai-chat'
              ? 'text-cyan-600 border-b-2 border-cyan-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bot className="h-4 w-4" />
          IA Chat ({games.filter(g => GAME_PLAYER_MODES[g.id] === 'ai-chat').length})
        </button>
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
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            progress={null}
            onSelect={() => setSelectedGame(game.id)}
            selected={selectedGame === game.id}
          />
        ))}
      </div>

      {/* Game Player Modal */}
      {selectedGame && (
        <GamePlayer
          gameId={selectedGame}
          gameName={games.find(g => g.id === selectedGame)?.name || 'Jogo'}
          onClose={() => setSelectedGame(null)}
          onComplete={async (score: number, won: boolean) => {
            console.log('Game completed:', { score, won });
            try {
              // Validar se selectedGame ainda existe
              if (selectedGame) {
                 await gamesApi.submitResult(selectedGame, {
                   score,
                   totalQuestions: 0, // Indeterminado por enquanto
                   correctCount: 0,
                   timeSpentSeconds: 0 
                 });
                 console.log('✅ Resultado salvo com sucesso');
              }
            } catch (err) {
              console.error('❌ Erro ao salvar resultado:', err);
            }
            setSelectedGame(null);
          }}
        />
      )}
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

      {/* Player Mode Badge - Top Right, aligned with icon */}
      <div className="absolute top-6 right-6 z-10">
        {GAME_PLAYER_MODES[game.id] === 'multiplayer' && (
          <div className="flex items-center gap-1 bg-purple-600 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
            <Users className="h-3.5 w-3.5" />
            <span>2P</span>
          </div>
        )}
        {GAME_PLAYER_MODES[game.id] === 'ai-chat' && (
          <div className="flex items-center gap-1 bg-cyan-600 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
            <Bot className="h-3.5 w-3.5" />
            <span>IA Chat</span>
          </div>
        )}
        {GAME_PLAYER_MODES[game.id] === 'solo' && (
          <div className="flex items-center gap-1 bg-white/30 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium shadow-lg">
            <User className="h-3.5 w-3.5" />
            <span>Solo</span>
          </div>
        )}
      </div>

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
