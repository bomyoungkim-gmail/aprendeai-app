'use client';

import { useState } from 'react';
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
          <h2 className="text-2xl font-bold text-gray-900">{gameName}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-colors" aria-label="Fechar jogo">
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
  const [result, setResult] = useState<{ score: number; violations: string[]; feedback: string } | null>(null);

  const targetWord = "Democracy";
  const forbidden = ["Vote", "Government", "People", "Election"];

  const handleSubmit = () => {
    const violations: string[] = [];
    forbidden.forEach(word => {
      if (answer.toLowerCase().includes(word.toLowerCase())) {
        violations.push(word);
      }
    });

    const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
    const hasViolation = violations.length > 0;
    const hasGoodLength = wordCount >= 5 && wordCount <= 50;
    
    let score = 0;
    let feedback = '';

    if (hasViolation) {
      score = 0;
      feedback = `❌ Você usou ${violations.length} palavra(s) proibida(s): ${violations.join(', ')}. Tente novamente sem essas palavras!`;
    } else if (!hasGoodLength) {
      score = 30;
      feedback = wordCount < 5 
        ? '⚠️ Descrição muito curta. Tente explicar melhor o conceito.'
        : '⚠️ Descrição muito longa. Seja mais conciso!';
    } else {
      score = 100;
      feedback = '✅ Excelente! Você descreveu o conceito sem usar palavras proibidas e com bom tamanho.';
    }

    setResult({ score, violations, feedback });
    setSubmitted(true);
  };

  const handleFinish = () => {
    if (result) {
      onComplete(result.score, result.score >= 70);
    }
  };

  if (submitted && result) {
    return (
      <div className="space-y-4">
        {/* Score Display */}
        <div className={`p-6 rounded-lg text-center ${
          result.score >= 70 ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
        }`}>
          <div className="text-6xl font-bold mb-2" style={{ color: result.score >= 70 ? '#16a34a' : '#dc2626' }}>
            {result.score}
          </div>
          <p className="text-sm text-gray-600">pontos</p>
        </div>

        {/* Feedback */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">Feedback</h3>
          <p className="text-gray-800">{result.feedback}</p>
        </div>

        {/* Violations (if any) */}
        {result.violations.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-900 mb-2">⚠️ Palavras Proibidas Usadas:</h3>
            <div className="flex flex-wrap gap-2">
              {result.violations.map(word => (
                <span key={word} className="bg-red-200 text-red-900 px-3 py-1 rounded-full text-sm font-bold">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Your Answer */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 mb-2">Sua Descrição:</h3>
          <p className="text-gray-800 italic">"{answer}"</p>
        </div>

        {/* Correct Example */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-bold text-green-900 mb-2">💡 Exemplo de Descrição Ideal:</h3>
          <p className="text-gray-800 italic">
            "Um sistema onde cidadãos escolhem seus representantes através de decisões coletivas, 
            garantindo que todos tenham voz nas decisões do país."
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setAnswer('');
              setSubmitted(false);
              setResult(null);
            }}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Tentar Novamente
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            Finalizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Descreva a palavra:</p>
        <h3 className="text-3xl font-bold text-center mb-4 text-blue-900">{targetWord}</h3>
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
        className="w-full border border-gray-300 rounded-lg p-3 h-32 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={submitted}
      />

      <button
        onClick={handleSubmit}
        disabled={submitted || answer.trim().length < 3}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-purple-900">Pergunta</h3>
        <p className="text-lg text-gray-800">{question}</p>
      </div>

      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selected === opt.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-300 hover:border-purple-300 bg-white'
            }`}
          >
            <span className="font-bold mr-3 text-purple-700">{opt.id})</span>
            <span className="text-gray-900">{opt.text}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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
      {/* Topic Context */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📚</span>
          <div>
            <h3 className="font-bold text-purple-900 mb-1">Tópico de Estudo</h3>
            <p className="text-lg font-semibold text-purple-800">Fotossíntese</p>
            <p className="text-sm text-gray-600 mt-1 italic">
              Processo pelo qual plantas produzem energia usando luz solar, água e CO₂...
            </p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-bold mb-2 text-green-900">📝 Resumo sem olhar</h3>
        <p className="text-gray-700 text-sm">
          Escreva 2-4 linhas resumindo o que você lembra sobre <strong>Fotossíntese</strong>, sem consultar.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Digite seu resumo:
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Digite seu resumo aqui..."
          className="w-full border border-gray-300 rounded-lg p-3 h-40 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Palavras: <strong className="text-gray-900">{answer.split(' ').filter(w => w.length > 0).length}</strong>
        </span>
        <span className="text-gray-500">Mínimo recomendado: 20 palavras</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={answer.length < 20}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        Enviar Resumo
      </button>
    </div>
  );
}
