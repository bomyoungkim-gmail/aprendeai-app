'use client';

import { useState, useMemo } from 'react';
import { GameQuestion } from '@/lib/api/games';

interface ProblemSolverGameProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * PROBLEM_SOLVER - Quiz style game
 * Adapter: Uses Backend Questions if provided, falls back to mock.
 */
export function ProblemSolverGame({ onComplete, questions }: ProblemSolverGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  // Map Backend Questions to Game Format
  const gameQuestions = useMemo(() => {
    if (questions && questions.length > 0) {
      return questions.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options || ['Verdadeiro', 'Falso'], // Fallback options
        correctId: q.correctAnswer || q.options?.[0] || 'A' // Simple fallback logic for dev
      }));
    }
    // Fallback Mock Data
    return [
      {
        id: '1',
        text: "Se a fotossíntese parar, o que acontece com o oxigênio?",
        options: ['Aumenta', 'Diminui', 'Sem mudança'],
        correctId: 'Diminui' // Using text as ID for simplicity in mock
      },
      {
        id: '2',
        text: "Qual é a capital da França?",
        options: ['Londres', 'Paris', 'Berlim'],
        correctId: 'Paris'
      }
    ];
  }, [questions]);

  const currentQuestion = gameQuestions[currentIndex];

  const handleSubmit = () => {
    if (!selected) return;

    // Check correctness
    // Note: Ideally compare IDs. Here comparing raw values for flexibility.
    const isCorrect = selected === currentQuestion.correctId || 
                      (currentQuestion.options.indexOf(selected) === currentQuestion.options.indexOf(currentQuestion.correctId));
    
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrectCount);

    if (currentIndex < gameQuestions.length - 1) {
      // Next Question
      setCurrentIndex(prev => prev + 1);
      setSelected(null);
    } else {
      // Finish
      const finalScore = Math.round((newCorrectCount / gameQuestions.length) * 100);
      onComplete(finalScore, finalScore >= 70);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Questão {currentIndex + 1} de {gameQuestions.length}</span>
        <span>Acertos: {correctCount}</span>
      </div>

      <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-purple-900">Pergunta</h3>
        <p className="text-lg text-gray-800">{currentQuestion.text}</p>
      </div>

      <div className="space-y-3">
        {currentQuestion.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => setSelected(opt)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selected === opt
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-300 hover:border-purple-300 bg-white'
            }`}
          >
            <span className="font-bold mr-3 text-purple-700">{String.fromCharCode(65 + idx)})</span>
            <span className="text-gray-900">{opt}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {currentIndex < gameQuestions.length - 1 ? 'Próxima Pergunta' : 'Finalizar Quiz'}
      </button>
    </div>
  );
}
