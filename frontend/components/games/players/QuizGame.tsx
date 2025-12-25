'use client';

import { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';

interface QuizPlayerProps {
  question: QuizQuestion;
  onComplete: (score: number, won: boolean, details?: any) => void;
}

export function QuizPlayer({ question, onComplete }: QuizPlayerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [question.id]);

  const qText = question.question.question;
  const options = question.question.options;
  // Note: Validation is done on backend or we need 'correctId' in the question data
  // For security, usually 'correctId' shouldn't be sent if we want to prevent cheating, 
  // but for MVP/Educational games it's often sent. The DTO suggests 'answer' comes separately.
  // Assuming 'answer' field is available in the top-level object if we want client-side validation,
  // OR we submit to backend to check.
  // For this MVP, let's assume validation happens on client for immediate feedback, so we need correctId.
  // Let's assume the API returns it in `answer` block for now.
  const correctId = (question.answer as any)?.correctId || 'A'; 

  const handleSubmit = () => {
    const isCorrect = selected === correctId;
    onComplete(isCorrect ? 100 : 0, isCorrect, { userAnswer: selected });
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-purple-900">Pergunta</h3>
        <p className="text-lg text-gray-800">{qText}</p>
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
