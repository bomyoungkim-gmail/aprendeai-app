'use client';

import { useState, useEffect } from 'react';
import { GameQuestion } from '../types';

interface FreeRecallPlayerProps {
  question: GameQuestion;
  onComplete: (score: number, won: boolean, details?: any) => void;
}

export function FreeRecallPlayer({ question, onComplete }: FreeRecallPlayerProps) {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    setAnswer('');
  }, [question.id]);

  const topic = question.topic;
  // Cast to specific type if needed, or access loosely
  const prompt = (question.question as any)?.prompt || "Resuma o tópico";

  const handleSubmit = () => {
    const wordCount = answer.split(/\s+/).filter(w => w.length > 0).length;
    // Simple heuristic score for MVP
    const score = Math.min(100, wordCount * 5);
    onComplete(score, score >= 50, { userAnswer: answer });
  };

  return (
    <div className="space-y-4">
      {/* Topic Context */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📚</span>
          <div>
            <h3 className="font-bold text-purple-900 mb-1">Tópico de Estudo</h3>
            <p className="text-lg font-semibold text-purple-800">{topic}</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-bold mb-2 text-green-900">📝 Resumo sem olhar</h3>
        <p className="text-gray-700 text-sm">
          {prompt}
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
          className="w-full border border-gray-300 rounded-lg p-4 min-h-[160px] text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
        />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Palavras: <strong className="text-gray-900">{answer.split(/\s+/).filter(w => w.length > 0).length}</strong>
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
