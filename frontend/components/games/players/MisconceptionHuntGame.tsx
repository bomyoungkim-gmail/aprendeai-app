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
      <div className="bg-pink-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">🕵️ Qual afirmação está ERRADA?</h3>
      </div>

      <div className="space-y-2">
        {statements.map(stmt => (
          <button
            key={stmt.id}
            onClick={() => setSelectedId(stmt.id)}
            className={`w-full p-4 text-left rounded-lg border-2 ${
              selectedId === stmt.id
                ? 'border-pink-600 bg-pink-50'
                : 'border-gray-200 hover:border-pink-300'
            }`}
          >
            {stmt.text}
          </button>
        ))}
      </div>

      {selectedId && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Explique por que está errada:
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Justifique sua escolha com evidências..."
            className="w-full border rounded-lg p-3 h-24"
          />
          <p className="text-xs text-gray-500 mt-1">{explanation.length} / 30 caracteres mín.</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedId || explanation.length < 30}
        className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50"
      >
        Enviar Resposta
      </button>
    </div>
  );
}
