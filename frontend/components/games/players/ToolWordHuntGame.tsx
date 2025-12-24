'use client';

import { useState } from 'react';

interface ToolWordHuntGameProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * TOOL_WORD_HUNT - Find word in text and justify
 */
export function ToolWordHuntGame({ onComplete }: ToolWordHuntGameProps) {
  const [selectedQuote, setSelectedQuote] = useState('');
  const [justification, setJustification] = useState('');

  const targetWord = "ironically";
  const text = "The situation was ironically amusing. Despite all his careful planning, he arrived late anyway. The irony was not lost on anyone present.";

  const handleSubmit = () => {
    const hasWord = selectedQuote.toLowerCase().includes(targetWord.toLowerCase());
    const hasJustification = justification.length >= 20;
    
    const score = (hasWord ? 50 : 0) + (hasJustification ? 50 : 0);
    onComplete(score, score >= 70);
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">🔍 Encontre: "{targetWord}"</h3>
        <p className="text-gray-700 leading-relaxed">{text}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Selecione a frase com a palavra:</label>
        <textarea
          value={selectedQuote}
          onChange={(e) => setSelectedQuote(e.target.value)}
          placeholder="Cole aqui a frase que contém a palavra..."
          className="w-full border rounded-lg p-3 h-20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Justifique o uso da palavra:</label>
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Explique o significado e por que foi usada nesse contexto..."
          className="w-full border rounded-lg p-3 h-24"
        />
        <p className="text-xs text-gray-500 mt-1">{justification.length} / 20 caracteres mín.</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedQuote.length < 5 || justification.length < 20}
        className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
      >
        Enviar Resposta
      </button>
    </div>
  );
}
