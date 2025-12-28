'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FeynmanTeacherGame } from './players/FeynmanTeacherGame';
import { AnalogyMakerGame } from './players/AnalogyMakerGame';
import { WhatIfScenarioGame } from './players/WhatIfScenarioGame';
import { SituationSimGame } from './players/SituationSimGame';
import { DebateMasterGame } from './players/DebateMasterGame';
import { SocraticDefenseGame } from './players/SocraticDefenseGame';
import { CloseSprintGame } from './players/CloseSprintGame';
import { SrsArenaGame } from './players/SrsArenaGame';
import { BossFightGame } from './players/BossFightGame';
import { ToolWordHuntGame } from './players/ToolWordHuntGame';
import { MisconceptionHuntGame } from './players/MisconceptionHuntGame';
import { RecommendationGame } from './players/RecommendationGame';
import { ProblemSolverGame } from './players/ProblemSolverGame';
import { FreeRecallGame } from './players/FreeRecallGame';
import { ConceptLinkingGame } from './players/ConceptLinkingGame';

interface GamePlayerProps {
  gameId: string;
  gameName: string;
  onClose: () => void;
  onComplete: (score: number, won: boolean) => void;
}

// Map all 15 game IDs to their player components
const GAME_COMPONENTS: Record<string, React.ComponentType<{ onComplete: (score: number, won: boolean) => void; questions?: any[] }>> = {
  // Basic games (inline implementation)
  'FREE_RECALL_SCORE': FreeRecallGame,
  'CONCEPT_LINKING': ConceptLinkingGame,
  'PROBLEM_SOLVER': ProblemSolverGame,
  
  // Template-based games
  'FEYNMAN_TEACHER': FeynmanTeacherGame,
  'ANALOGY_MAKER': AnalogyMakerGame,
  'WHAT_IF_SCENARIO': WhatIfScenarioGame,
  'SITUATION_SIM': SituationSimGame,
  'DEBATE_MASTER': DebateMasterGame,
  'SOCRATIC_DEFENSE': SocraticDefenseGame,
  
  // Custom games
  'CLOZE_SPRINT': CloseSprintGame,
  'SRS_ARENA': SrsArenaGame,
  'BOSS_FIGHT_VOCAB': BossFightGame,
  'TOOL_WORD_HUNT': ToolWordHuntGame,
  'MISCONCEPTION_HUNT': MisconceptionHuntGame,
  'RECOMMENDATION_ENGINE': RecommendationGame,
};

export function GamePlayer({ gameId, gameName, onClose, onComplete }: GamePlayerProps) {
  const GameComponent = GAME_COMPONENTS[gameId];
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions on mount
  useEffect(() => {
    let mounted = true;
    const loadQuestions = async () => {
      try {
        setLoading(true);
        // Use the new centralized API client
        const { gamesApi } = await import('@/lib/api/games');
        const data = await gamesApi.getQuestions(gameId);
        if (mounted) setQuestions(data);
      } catch (err) {
        console.error('Failed to load questions:', err);
        if (mounted) setError('Using offline mode');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadQuestions();
    return () => { mounted = false; };
  }, [gameId]);

  if (!GameComponent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{gameName}</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600">
            Este jogo ainda não tem um player implementado. Em breve!
          </p>
          <p className="text-sm text-gray-500 mt-4">Game ID: {gameId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
             <h2 className="text-2xl font-bold text-gray-900">{gameName}</h2>
             {loading && <span className="text-xs text-blue-600 animate-pulse">Carregando perguntas...</span>}
             {error && <span className="text-xs text-gray-500">Modo Offline (Mock Data)</span>}
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-colors" aria-label="Fechar jogo">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Pass questions to all components - those that don't support it will ignore it */}
        <GameComponent onComplete={onComplete} questions={questions} />
      </div>
    </div>
  );
}

// Basic game implementations




