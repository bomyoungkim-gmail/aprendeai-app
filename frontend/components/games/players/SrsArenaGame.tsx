'use client';

import { useState } from 'react';

interface SrsArenaGameProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * SRS_ARENA - Flashcard-style spaced repetition
 */
export function SrsArenaGame({ onComplete }: SrsArenaGameProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const cards = [
    { front: "O que é mitocôndria?", back: "Organela responsável pela produção de energia (ATP)" },
    { front: "O que é DNA?", back: "Ácido desoxirribonucleico - material genético" },
    { front: "O que é fotossíntese?", back: "Processo de produção de alimento usando luz solar" },
  ];

  const handleRating = (remembered: boolean) => {
    const newResults = [...results, remembered];
    setResults(newResults);

    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    } else {
      const correct = newResults.filter(r => r).length;
      const score = (correct / cards.length) * 100;
      onComplete(score, score >= 70);
    }
  };

  const card = cards[currentCard];

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-gray-600">
        Card {currentCard + 1} de {cards.length}
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg p-8 min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          {!showAnswer ? (
            <div>
              <p className="text-xl font-bold mb-4">{card.front}</p>
              <button
                onClick={() => setShowAnswer(true)}
                className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100"
              >
                Mostrar Resposta
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-2 opacity-75">{card.front}</p>
              <p className="text-lg font-bold">{card.back}</p>
            </div>
          )}
        </div>
      </div>

      {showAnswer && (
        <div className="flex gap-2">
          <button
            onClick={() => handleRating(false)}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600"
          >
            ❌ Não Lembrei
          </button>
          <button
            onClick={() => handleRating(true)}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
          >
            ✓ Lembrei!
          </button>
        </div>
      )}
    </div>
  );
}
