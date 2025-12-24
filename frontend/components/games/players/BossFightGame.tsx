'use client';

import { useState } from 'react';

interface BossFightGameProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * BOSS_FIGHT_VOCAB - Battle boss with vocab knowledge
 */
export function BossFightGame({ onComplete }: BossFightGameProps) {
  const [lives, setLives] = useState(3);
  const [bossHealth, setBossHealth] = useState(100);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const questions = [
    {
      word: "Eloquent",
      question: "Qual o sinônimo?",
      options: ["A) Articulado", "B) Silencioso", "C) Rápido"],
      correct: "A",
    },
    {
      word: "Ambiguous",
      question: "Qual o significado?",
      options: ["A) Claro", "B) Duvidoso", "C) Óbvio"],
      correct: "B",
    },
  ];

  const question = questions[currentQuestion];

  const handleSubmit = () => {
    const isCorrect = selectedAnswer === question.correct;

    if (isCorrect) {
      const newHealth = bossHealth - 50;
      setBossHealth(newHealth);
      
      if (newHealth <= 0) {
        onComplete(100, true); // Victory!
        return;
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives <= 0) {
        onComplete(0, false); // Defeat
        return;
      }
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // Ran out of questions
      const score = ((3 - lives) / 3) * 100;
      onComplete(score, bossHealth <= 50);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm text-gray-600">❤️ Vidas: </span>
          <span className="text-xl font-bold">{lives}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">👹 Boss HP: </span>
          <div className="w-40 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500"
              style={{ width: `${bossHealth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
        <h3 className="text-2xl font-bold text-center mb-2">{question.word}</h3>
        <p className="text-center text-gray-700 mb-4">{question.question}</p>

        <div className="space-y-2">
          {question.options.map(opt => {
            const optId = opt.charAt(0);
            return (
              <button
                key={optId}
                onClick={() => setSelectedAnswer(optId)}
                className={`w-full p-3 rounded-lg border-2 text-left ${
                  selectedAnswer === optId
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedAnswer}
        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        ⚔️ Atacar!
      </button>
    </div>
  );
}
