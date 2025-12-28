'use client';

import { useState, useMemo } from 'react';
import { GameQuestion } from '@/lib/api/games';

interface SrsArenaGameProps {
  questions?: GameQuestion[];
  onComplete: (score: number, won: boolean) => void;
}

/**
 * SRS_ARENA - Flashcard-style spaced repetition
 * Adapter: Uses Backend Questions if provided, falls back to mock if empty.
 */
export function SrsArenaGame({ questions, onComplete }: SrsArenaGameProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  // Use dynamic questions if available, otherwise fallback (Safe Migration)
  const cards = useMemo(() => {
    if (questions && questions.length > 0) {
      return questions.map(q => ({
        front: q.text,
        back: q.correctAnswer || q.explanation || 'Resposta não disponível' // Flashcards often use correctAnswer as back
      }));
    }
    return [
      { front: "O que é mitocôndria?", back: "Organela responsável pela produção de energia (ATP)" },
      { front: "O que é DNA?", back: "Ácido desoxirribonucleico - material genético" },
      { front: "O que é fotossíntese?", back: "Processo de produção de alimento usando luz solar" },
    ];
  }, [questions]);

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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-3 text-center text-sm">
            Quão fácil foi lembrar?
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleRating(false)}
              className="bg-red-100 hover:bg-red-200 text-red-900 py-2 px-3 rounded-lg font-medium transition-colors border border-red-300 text-sm"
            >
              😰 Difícil
              <p className="text-xs mt-0.5 opacity-75">~1 dia</p>
            </button>
            <button
              onClick={() => handleRating(true)}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 py-2 px-3 rounded-lg font-medium transition-colors border border-yellow-300 text-sm"
            >
              🤔 Bom
              <p className="text-xs mt-0.5 opacity-75">~3 dias</p>
            </button>
            <button
              onClick={() => handleRating(true)}
              className="bg-green-100 hover:bg-green-200 text-green-900 py-2 px-3 rounded-lg font-medium transition-colors border border-green-300 text-sm"
            >
              😄 Fácil
              <p className="text-xs mt-0.5 opacity-75">~7 dias</p>
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            ℹ️ Sua avaliação agenda a próxima revisão
          </p>
        </div>
      )}
    </div>
  );
}
