'use client';

import { useState } from 'react';
import { PromptInput } from '@/components/reading/PromptInput';

interface TextInputPlayerProps {
  prompt: string;
  placeholder?: string;
  minWords?: number;
  maxWords?: number;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
}

/**
 * Reusable template for text-based games
 * Used by: FEYNMAN_TEACHER, ANALOGY_MAKER, FREE_RECALL, etc
 */
export function TextInputPlayer({
  prompt,
  placeholder = 'Digite sua resposta...',
  minWords = 5,
  maxWords = 500,
  onSubmit,
  onCancel,
}: TextInputPlayerProps) {
  const [text, setText] = useState('');

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isValid = wordCount >= minWords && wordCount <= maxWords;

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(text);
    }
  };

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-gray-900 whitespace-pre-wrap">{prompt}</p>
      </div>

      {/* Reuses existing PromptInput component */}
      <div>
        <PromptInput
          onSend={handleSubmit}
          disabled={!isValid}
          placeholder={placeholder}
        />
      </div>

      {/* Word Counter */}
      <div className="flex justify-between text-sm">
        <span className={wordCount < minWords ? 'text-red-600' : 'text-gray-600'}>
          Palavras: {wordCount} / {minWords} mínimo
        </span>
        {maxWords && (
          <span className={wordCount > maxWords ? 'text-red-600' : 'text-gray-400'}>
            Máximo: {maxWords}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
        {onCancel && (
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
