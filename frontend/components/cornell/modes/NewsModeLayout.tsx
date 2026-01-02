/**
 * NEWS Mode Layout Component
 * 
 * UI Component - no business logic
 * Following MelhoresPraticas.txt: components for UI only
 * 
 * G4.1: Microquiz opt-in ao final
 * G4.2: Zero intervenções durante leitura
 * G4.3: Síntese opcional
 */

import React, { useState } from 'react';
import { Newspaper, CheckCircle2 } from 'lucide-react';
import { useTelemetry } from '@/hooks/telemetry/use-telemetry';

interface NewsModeLayoutProps {
  contentId: string;
  onComplete?: () => void;
}

const SYNTHESIS_MIN_CHARS = 50;
const SYNTHESIS_MAX_CHARS = 280; // Twitter-style (Refinamento G4.3)

export function NewsModeLayout({ contentId, onComplete }: NewsModeLayoutProps) {
  const [showPostQuiz, setShowPostQuiz] = useState(false);
  const [quizOptedIn, setQuizOptedIn] = useState(false);
  const [synthesis, setSynthesis] = useState('');
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const { track } = useTelemetry(contentId);

  const isValidSynthesis = 
    synthesis.length >= SYNTHESIS_MIN_CHARS && 
    synthesis.length <= SYNTHESIS_MAX_CHARS;

  const handleReadingComplete = () => {
    setShowPostQuiz(true);
    track('NEWS_READING_COMPLETE', {
      contentId,
      timestamp: Date.now()
    });
  };

  const handleQuizOptIn = (optIn: boolean) => {
    setQuizOptedIn(optIn);
    
    // G4.1: Track opt-in decision
    track('news_quiz_opted_in', {
      optedIn: optIn,
      contentId
    });

    if (!optIn) {
      onComplete?.();
    }
  };

  const handleSynthesisSubmit = () => {
    if (!isValidSynthesis) return;

    // G4.3: Track synthesis
    track('news_synthesis_provided', {
      synthesisLength: synthesis.length,
      contentId
    });

    onComplete?.();
  };

  const handleQuizComplete = (score: number) => {
    setQuizScore(score);

    // G4.1: Track quiz score
    track('news_quiz_score', {
      score,
      contentId
    });
  };

  if (!showPostQuiz) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Newspaper className="w-16 h-16 text-blue-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Lendo em modo NEWS...
        </p>
        <button
          onClick={handleReadingComplete}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Concluir Leitura
        </button>
      </div>
    );
  }

  if (!quizOptedIn && quizScore === null) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Leitura Concluída!
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Quer testar sua compreensão?
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => handleQuizOptIn(true)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sim
          </button>
          <button
            onClick={() => handleQuizOptIn(false)}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Não
          </button>
        </div>
      </div>
    );
  }

  if (quizOptedIn && quizScore === null) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Quiz Factual
        </h3>
        
        {/* Placeholder for quiz questions - would integrate with assessment system */}
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Quiz de compreensão factual...
          </p>
          
          <button
            onClick={() => handleQuizComplete(0.8)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Simular Conclusão (80%)
          </button>
        </div>
      </div>
    );
  }

  // G4.3: Synthesis prompt
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Síntese (Opcional)
      </h3>

      {quizScore !== null && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-green-700 dark:text-green-400">
            ✓ Quiz concluído: {Math.round(quizScore * 100)}%
          </p>
        </div>
      )}

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Resuma o artigo em 1-2 frases:
      </p>

      <textarea
        value={synthesis}
        onChange={(e) => setSynthesis(e.target.value)}
        maxLength={SYNTHESIS_MAX_CHARS}
        placeholder={`Resuma em ${SYNTHESIS_MIN_CHARS}-${SYNTHESIS_MAX_CHARS} caracteres...`}
        className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <div className="flex justify-between items-center mt-2">
        <p className={`text-sm ${
          synthesis.length < SYNTHESIS_MIN_CHARS 
            ? 'text-gray-400' 
            : synthesis.length > SYNTHESIS_MAX_CHARS 
            ? 'text-red-600' 
            : 'text-green-600'
        }`}>
          {synthesis.length}/{SYNTHESIS_MAX_CHARS} caracteres
          {synthesis.length < SYNTHESIS_MIN_CHARS && ` (mínimo: ${SYNTHESIS_MIN_CHARS})`}
        </p>

        <button
          onClick={handleSynthesisSubmit}
          disabled={!isValidSynthesis}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Concluir
        </button>
      </div>
    </div>
  );
}
