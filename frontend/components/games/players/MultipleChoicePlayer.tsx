'use client';

import { useState } from 'react';
import { QuickReplies } from '@/components/reading/QuickReplies';

interface Option {
  id: string;
  text: string;
}

interface MultipleChoicePlayerProps {
  question: string;
  options: Option[];
  correctId?: string; // Optional for immediate feedback
  onSubmit: (selectedId: string) => void;
  onCancel?: () => void;
}

/**
 * Reusable template for multiple choice games
 * Used by: PROBLEM_SOLVER, DEBATE_MASTER, WHAT_IF_SCENARIO, etc
 */
export function MultipleChoicePlayer({
  question,
  options,
  correctId,
  onSubmit,
  onCancel,
}: MultipleChoicePlayerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected) {
      setSubmitted(true);
      onSubmit(selected);
    }
  };

  const showFeedback = submitted && correctId;
  const isCorrect = selected === correctId;

  return (
    <div className="space-y-4">
      {/* Question */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-bold text-gray-900 mb-2">Pergunta</h3>
        <p className="text-gray-800">{question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected === option.id;
          const showCorrect = showFeedback && option.id === correctId;
          const showWrong = showFeedback && isSelected && option.id !== correctId;

          return (
            <button
              key={option.id}
              onClick={() => !submitted && setSelected(option.id)}
              disabled={submitted}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                isSelected
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              } ${
                showCorrect ? 'bg-green-50 border-green-500' : ''
              } ${
                showWrong ? 'bg-red-50 border-red-500' : ''
              } ${
                submitted ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="flex-1 font-medium text-gray-900">{option.text}</span>
                {showCorrect && <span className="text-green-600">✓</span>}
                {showWrong && <span className="text-red-600">✗</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!selected || submitted}
          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitted ? 'Enviado!' : 'Confirmar'}
        </button>
        {onCancel && !submitted && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
