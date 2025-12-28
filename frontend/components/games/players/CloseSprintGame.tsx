import { useState, useMemo } from 'react';
import { GameTimer } from '../shared/GameTimer';
import { GameQuestion } from '@/lib/api/games';

interface ClozeSprintGameProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * CLOZE_SPRINT - Fill in the blanks quickly
 */
export function CloseSprintGame({ onComplete, questions }: ClozeSprintGameProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeUp, setTimeUp] = useState(false);

  // Map Backend Data
  const gameData = useMemo(() => {
    if (questions && questions.length > 0) {
      const q = questions[0];
      // Assume 'text' is the full sentence with placeholders like ___ or [...]
      // And 'options' or 'details.blanks' are the correct answers
      const sentence = q.text; 
      // Rudimentary parsing: if options provided, map to blanks
      const blanks = (q.options || []).map((ans, idx) => ({
        id: idx,
        correct: ans,
        position: idx // simplified position logic
      }));
      
      if (blanks.length > 0) {
        return { sentence, blanks };
      }
    }
    // Fallback Mock Data
    return {
      sentence: "A ___ é o processo pelo qual plantas produzem ___ usando luz solar.",
      blanks: [
        { id: 0, correct: 'fotossíntese', position: 2 },
        { id: 1, correct: 'alimento', position: 9 },
      ]
    };
  }, [questions]);
  
  const { sentence, blanks } = gameData;

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

      <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
        <h3 className="font-bold mb-4 text-xl text-gray-900">Complete as lacunas:</h3>
        <p className="text-lg leading-relaxed text-gray-800">{sentence}</p>
      </div>

      {blanks.map((blank, idx) => (
        <div key={blank.id}>
          <label className="block text-sm font-medium mb-1 text-gray-700">Lacuna {idx + 1}:</label>
          <input
            type="text"
            value={answers[blank.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [blank.id]: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Digite aqui..."
            disabled={timeUp}
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={timeUp || Object.keys(answers).length < blanks.length}
        className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {timeUp ? 'Tempo Esgotado!' : 'Enviar'}
      </button>
    </div>
  );
}
