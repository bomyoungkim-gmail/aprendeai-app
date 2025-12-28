'use client';

import { useState, useMemo } from 'react';
import { GameQuestion } from '@/lib/api/games';

interface FreeRecallGameProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * FREE_RECALL - Study technique where user writes everything they remember.
 * Adapter: Uses Backend "Question" as the Topic/Context source.
 */
export function FreeRecallGame({ onComplete, questions }: FreeRecallGameProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Map Backend Question to Game Topic
  const topicData = useMemo(() => {
    if (questions && questions.length > 0) {
      const q = questions[0];
      return {
        topic: q.text, // The main question/topic
        context: q.explanation || 'Tente lembrar o máximo de detalhes possível sobre este tópico.',
        minWords: 20
      };
    }
    // Fallback Mock Data
    return {
      topic: 'Fotossíntese',
      context: 'Processo pelo qual plantas produzem energia usando luz solar, água e CO₂...',
      minWords: 20
    };
  }, [questions]);

  const wordCount = answer.split(/\s+/).filter(w => w.length > 0).length;

  const handleSubmit = () => {
    // Simple scoring based on volume (MVP)
    // Future: Use AI to validate semantic relevance
    const score = Math.min(100, Math.round((wordCount / topicData.minWords) * 100));
    setSubmitted(true);
    
    // Delay completion to show feedback if we want, or immediate
    setTimeout(() => {
        onComplete(score, score >= 50);
    }, 1500); // 1.5s delay to see "Enviado"
  };

  return (
    <div className="space-y-4">
      {/* Topic Context */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📚</span>
          <div>
            <h3 className="font-bold text-purple-900 mb-1">Tópico de Estudo</h3>
            <p className="text-lg font-semibold text-purple-800">{topicData.topic}</p>
            <p className="text-sm text-gray-600 mt-1 italic">
              {topicData.context}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-bold mb-2 text-green-900">📝 Resumo sem olhar</h3>
        <p className="text-gray-700 text-sm">
          Escreva tudo o que você lembra sobre <strong>{topicData.topic}</strong>, sem consultar suas anotações.
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
          disabled={submitted}
        />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Palavras: <strong className={wordCount >= topicData.minWords ? "text-green-600" : "text-gray-900"}>{wordCount}</strong>
        </span>
        <span className="text-gray-500">Mínimo recomendado: {topicData.minWords} palavras</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={wordCount < 5 || submitted}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {submitted ? `Enviado! Analisando...` : 'Enviar Resumo'}
      </button>
    </div>
  );
}
