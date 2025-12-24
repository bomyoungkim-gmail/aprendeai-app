'use client';

import { useState } from 'react';
import { GameTimer } from '../shared/GameTimer';

interface ClozeSprint GameProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * CLOZE_SPRINT - Fill in the blanks quickly
 */
export function CloseSprintGame({ onComplete }: ClozeSprint GameProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeUp, setTimeUp] = useState(false);

  const sentence = "A ___ é o processo pelo qual plantas produzem ___ usando luz solar.";
  const blanks = [
    { id: 0, correct: 'fotossíntese', position: 2 },
    { id: 1, correct: 'alimento', position: 9 },
  ];

  const handleSubmit = () => {
    let correct = 0;
    blanks.forEach(blank => {
      if (answers[blank.id]?.toLowerCase().includes(blank.correct.toLowerCase())) {
        correct++;
      }
    });
    
    const score = (correct / blanks.length) * 100;
    onComplete(score, score >= 70);
  };

  return (
    <div className="space-y-4">
      <GameTimer duration={30} onTimeUp={() => {
        setTimeUp(true);
        handleSubmit();
      }} />

      <div className="bg-orange-50 p-6 rounded-lg">
        <h3 className="font-bold mb-4 text-xl">Complete as lacunas:</h3>
        <p className="text-lg leading-relaxed">{sentence}</p>
      </div>

      {blanks.map((blank, idx) => (
        <div key={blank.id}>
          <label className="block text-sm font-medium mb-1">Lacuna {idx + 1}:</label>
          <input
            type="text"
            value={answers[blank.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [blank.id]: e.target.value })}
            className="w-full border rounded-lg p-3"
            placeholder="Digite aqui..."
            disabled={timeUp}
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={timeUp || Object.keys(answers).length < blanks.length}
        className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
      >
        {timeUp ? 'Tempo Esgotado!' : 'Enviar'}
      </button>
    </div>
  );
}
