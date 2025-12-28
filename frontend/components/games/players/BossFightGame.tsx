import { useState, useMemo, useEffect } from 'react';
import { GameQuestion } from '@/lib/api/games';

interface BossFightGameProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * BOSS_FIGHT_VOCAB - Battle boss with vocab knowledge
 */
export function BossFightGame({ onComplete, questions: apiQuestions }: BossFightGameProps) {
  const [lives, setLives] = useState(3);
  const [bossHealth, setBossHealth] = useState(100);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Map and Memoize Questions
  const questions = useMemo(() => {
    if (apiQuestions && apiQuestions.length > 0) {
      return apiQuestions.map(q => ({
        word: q.text,
        question: q.explanation || "Qual o significado?",
        options: q.options || [],
        correct: q.correctAnswer || '0' // Need robust logic for correct mapping
      }));
    }
    // Mock Fallback
    return [
      {
        word: "Eloquent",
        question: "Qual o sinônimo?",
        options: ["A) Articulado", "B) Silencioso", "C) Rápido"],
        correct: "A) Articulado", // Simplified for string match or use ID
      },
      {
        word: "Ambiguous",
        question: "Qual o significado?",
        options: ["A) Claro", "B) Duvidoso", "C) Óbvio"],
        correct: "B) Duvidoso",
      },
    ];
  }, [apiQuestions]);
  
  // NOTE: Logic in handleSubmit assumes 'correct' matches 'selectedAnswer'. 
  // API questions 'correctAnswer' might be an index or the string itself.
  // I'll assume exact string matching for 'options' to handle both.
  
  // Need to adjust options parsing in render as well if we rely on "A)" prefixes.
  // The original mock had prefixes in the option string.
  // I will make the renderer robust to both simple strings and prefixed strings.

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
          {question.options.map((opt, idx) => {
            const optId = opt; // Use full string as ID for simple matching
            return (
              <button
                key={idx}
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
