'use client';

import { useState } from 'react';

interface MisconceptionHuntGameProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * MISCONCEPTION_HUNT - Find errors in statements
 */
export function MisconceptionHuntGame({ onComplete }: MisconceptionHuntGameProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');

  const statements = [
    { id: 1, text: "Antibióticos são eficazes contra vírus.", wrong: true },
    { id: 2, text: "A água ferve a 100°C ao nível do mar.", wrong: false },
    { id: 3, text: "Usamos apenas 10% do nosso cérebro.", wrong: true },
  ];

  const correctWrongId = statements.find(s => s.wrong)?.id || 1;

  const handleSubmit = () => {
    const correctId = selectedId === correctWrongId;
    const hasExplanation = explanation.length >= 30;
    
    const score = (correctId ? 60 : 0) + (hasExplanation ? 40 : 0);
    onComplete(score, score >= 70);
  };

  return (
    <div className="space-y-4">
      <div className="bg-pink-50 border border-pink-200 p-6 rounded-lg">
        <h3 className="font-bold mb-2 text-pink-900">🕵️ Qual afirmação está ERRADA?</h3>
      </div>

      <div className="space-y-3">
        {statements.map(stmt => (
          <button
            key={stmt.id}
            onClick={() => setSelectedId(stmt.id)}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              selectedId === stmt.id
                ? 'border-pink-600 bg-pink-50'
                : 'border-gray-300 hover:border-pink-300 bg-white'
            }`}
          >
            <span className="text-gray-900">{stmt.text}</span>
          </button>
        ))}
      </div>

      {selectedId && (
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Explique por que está errada:
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Justifique sua escolha com evidências..."
            className="w-full border border-gray-300 rounded-lg p-4 h-32 text-gray-900 bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">{explanation.length} / 30 caracteres mín.</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedId || explanation.length < 30}
        className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        Enviar Resposta
      </button>
    </div>
  );
}
