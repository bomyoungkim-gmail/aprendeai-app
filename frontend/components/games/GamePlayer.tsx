'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FeynmanTeacherGame } from './players/FeynmanTeacherGame';
import { AnalogyMakerGame } from './players/AnalogyMakerGame';
import { WhatIfScenarioGame } from './players/WhatIfScenarioGame';
import { SituationSimGame } from './players/SituationSimGame';
import { DebateMasterGame } from './players/DebateMasterGame';
import { SocraticDefenseGame } from './players/SocraticDefenseGame';
import { ClozeSprint Game } from './players/CloseSprintGame';
import { SrsArenaGame } from './players/SrsArenaGame';
import { BossFightGame } from './players/BossFightGame';
import { ToolWordHuntGame } from './players/ToolWordHuntGame';
import { MisconceptionHunt} from './players/MisconceptionHuntGame';
import { RecommendationGame } from './players/RecommendationGame';

interface GamePlayerProps {
  gameId: string;
  gameName: string;
  onClose: () => void;
  onComplete: (score: number, won: boolean) => void;
}

// Map all 15 game IDs to their player components
const GAME_COMPONENTS: Record<string, React.ComponentType<{ onComplete: (score: number, won: boolean) => void }>> = {
  // Basic games (inline implementation)
  'FREE_RECALL_SCORE': FreeRecallPlayer,
  'CONCEPT_LINKING': ConceptLinkingPlayer,
  'PROBLEM_SOLVER': QuizPlayer,
  
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

  if (!GameComponent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{gameName}</h2>
            <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded">
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
          <h2 className="text-2xl font-bold">{gameName}</h2>
          <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <GameComponent onComplete={onComplete} />
      </div>
    </div>
  );
}

// Basic game implementations
function ConceptLinkingPlayer({ onComplete }: { onComplete: (score: number, won: boolean) => void }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const targetWord = "Democracy";
  const forbidden = ["Vote", "Government", "People", "Election"];

  const handleSubmit = () => {
    const hasViolation = forbidden.some(w => answer.toLowerCase().includes(w.toLowerCase()));
    const score = hasViolation ? 0 : (answer.split(' ').length >= 5 ? 100 : 50);
    
    setSubmitted(true);
    setTimeout(() => onComplete(score, !hasViolation), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Descreva a palavra:</p>
        <h3 className="text-3xl font-bold text-center mb-4">{targetWord}</h3>
        <p className="text-sm text-gray-600">Palavras proibidas:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {forbidden.map(w => (
            <span key={w} className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
              {w}
            </span>
          ))}
        </div>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Escreva sua descrição aqui..."
        className="w-full border rounded-lg p-3 h-32"
        disabled={submitted}
      />

      <button
        onClick={handleSubmit}
        disabled={submitted || answer.length < 10}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {submitted ? 'Enviado!' : 'Enviar Resposta'}
      </button>
    </div>
  );
}

function QuizPlayer({ onComplete }: { onComplete: (score: number, won: boolean) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const question = "Se a fotossíntese parar, o que acontece com o oxigênio?";
  const options = [
    { id: 'A', text: 'Aumenta' },
    { id: 'B', text: 'Diminui' },
    { id: 'C', text: 'Sem mudança' },
  ];
  const correct = 'B';

  const handleSubmit = () => {
    const isCorrect = selected === correct;
    onComplete(isCorrect ? 100 : 0, isCorrect);
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Pergunta</h3>
        <p className="text-lg">{question}</p>
      </div>

      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition ${
              selected === opt.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <span className="font-bold mr-2">{opt.id})</span>
            {opt.text}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        Confirmar Resposta
      </button>
    </div>
  );
}

function FreeRecallPlayer({ onComplete }: { onComplete: (score: number, won: boolean) => void }) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    const wordCount = answer.split(' ').filter(w => w.length > 0).length;
    const score = Math.min(100, wordCount * 5);
    onComplete(score, score >= 50);
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">📝 Resumo sem olhar</h3>
        <p className="text-gray-600">
          Escreva 2-4 linhas resumindo o que você lembra do texto, sem consultar.
        </p>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Digite seu resumo aqui..."
        className="w-full border rounded-lg p-3 h-40"
      />

      <div className="flex justify-between text-sm text-gray-600">
        <span>Palavras: {answer.split(' ').filter(w => w.length > 0).length}</span>
        <span>Mínimo recomendado: 20 palavras</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={answer.length < 20}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        Enviar Resumo
      </button>
    </div>
  );
}
