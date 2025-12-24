'use client';

import { useState } from 'react';

interface TabooPlayerProps {
  targetWord: string;
  forbiddenWords: string[];
  onSubmit: (description: string) => void;
  onCancel?: () => void;
}

/**
 * Reusable template for taboo-style games
 * Used by: CONCEPT_LINKING, VOCABULARY games
 */
export function TabooPlayer({
  targetWord,
  forbiddenWords,
  onSubmit,
  onCancel,
}: TabooPlayerProps) {
  const [description, setDescription] = useState('');
  const [violations, setViolations] = useState<string[]>([]);

  const checkViolations = (text: string) => {
    const found = forbiddenWords.filter(word =>
      text.toLowerCase().includes(word.toLowerCase())
    );
    setViolations(found);
    return found.length === 0;
  };

  const handleSubmit = () => {
    const isValid = checkViolations(description);
    if (isValid && description.length >= 10) {
      onSubmit(description);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDescription(text);
    checkViolations(text);
  };

  const hasViolations = violations.length > 0;
  const isValid = description.length >= 10 && !hasViolations;

  return (
    <div className="space-y-4">
      {/* Target Word */}
      <div className="bg-blue-50 p-6 rounded-lg text-center">
        <p className="text-sm text-gray-600 mb-2">Descreva a palavra:</p>
        <h2 className="text-4xl font-bold text-gray-900">{targetWord}</h2>
      </div>

      {/* Forbidden Words */}
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">🚫 Palavras Proibidas:</p>
        <div className="flex flex-wrap gap-2">
          {forbiddenWords.map((word, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full font-medium ${
                violations.includes(word)
                  ? 'bg-red-200 text-red-900 ring-2 ring-red-500'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Description Input */}
      <div>
        <textarea
          value={description}
          onChange={handleChange}
          placeholder="Escreva sua descrição aqui sem usar as palavras proibidas..."
          className={`w-full border-2 rounded-lg p-3 h-32 focus:outline-none focus:ring-2 ${
            hasViolations
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        
        {/* Violations Alert */}
        {hasViolations && (
          <p className="mt-2 text-sm text-red-600 font-medium">
            ⚠️ Você usou palavra(s) proibida(s): {violations.join(', ')}
          </p>
        )}
        
        {/* Character Count */}
        <p className={`mt-2 text-sm ${description.length < 10 ? 'text-red-600' : 'text-gray-600'}`}>
          {description.length} caracteres (mínimo: 10)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar Descrição
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
