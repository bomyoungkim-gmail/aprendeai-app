'use client';

import { useState, useMemo } from 'react';
import { GameQuestion } from '@/lib/api/games';

interface ConceptLinkingGameProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * CONCEPT_LINKING - Describe a concept efficiently avoiding forbidden words.
 * Adapter: Uses 'text' as Target Word and 'options' as Forbidden Words.
 */
export function ConceptLinkingGame({ onComplete, questions }: ConceptLinkingGameProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; violations: string[]; feedback: string } | null>(null);

  // Map Backend Data
  const gameData = useMemo(() => {
    if (questions && questions.length > 0) {
      const q = questions[0];
      return {
        targetWord: q.text,
        forbidden: q.options || [], // Use options as forbidden words
        explanation: q.explanation
      };
    }
    // Fallback Mock Data
    return {
      targetWord: "Democracy",
      forbidden: ["Vote", "Government", "People", "Election"],
      explanation: "Um sistema onde cidadãos escolhem seus representantes..."
    };
  }, [questions]);

  const handleSubmit = () => {
    const violations: string[] = [];
    gameData.forbidden.forEach(word => {
      if (answer.toLowerCase().includes(word.toLowerCase())) {
        violations.push(word);
      }
    });

    const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
    const hasViolation = violations.length > 0;
    const hasGoodLength = wordCount >= 5 && wordCount <= 50;
    
    let score = 0;
    let feedback = '';

    if (hasViolation) {
      score = 0;
      feedback = `❌ Você usou ${violations.length} palavra(s) proibida(s): ${violations.join(', ')}. Tente novamente sem essas palavras!`;
    } else if (!hasGoodLength) {
      score = 30;
      feedback = wordCount < 5 
        ? '⚠️ Descrição muito curta. Tente explicar melhor o conceito.'
        : '⚠️ Descrição muito longa. Seja mais conciso!';
    } else {
      score = 100;
      feedback = '✅ Excelente! Você descreveu o conceito sem usar palavras proibidas e com bom tamanho.';
    }

    setResult({ score, violations, feedback });
    setSubmitted(true);
  };

  const handleFinish = () => {
    if (result) {
      onComplete(result.score, result.score >= 70);
    }
  };

  if (submitted && result) {
    return (
      <div className="space-y-4">
        {/* Score Display */}
        <div className={`p-6 rounded-lg text-center ${
          result.score >= 70 ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
        }`}>
          <div className="text-6xl font-bold mb-2" style={{ color: result.score >= 70 ? '#16a34a' : '#dc2626' }}>
            {result.score}
          </div>
          <p className="text-sm text-gray-600">pontos</p>
        </div>

        {/* Feedback */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">Feedback</h3>
          <p className="text-gray-800">{result.feedback}</p>
        </div>

        {/* Violations (if any) */}
        {result.violations.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-900 mb-2">⚠️ Palavras Proibidas Usadas:</h3>
            <div className="flex flex-wrap gap-2">
              {result.violations.map(word => (
                <span key={word} className="bg-red-200 text-red-900 px-3 py-1 rounded-full text-sm font-bold">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Your Answer */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 mb-2">Sua Descrição:</h3>
          <p className="text-gray-800 italic">"{answer}"</p>
        </div>

        {/* Correct Example (Only if explanation available) */}
        {gameData.explanation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-2">💡 Exemplo/Explicação:</h3>
            <p className="text-gray-800 italic">
              {gameData.explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setAnswer('');
              setSubmitted(false);
              setResult(null);
            }}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Tentar Novamente
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            Finalizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Descreva a palavra:</p>
        <h3 className="text-3xl font-bold text-center mb-4 text-blue-900">{gameData.targetWord}</h3>
        <p className="text-sm text-gray-600">Palavras proibidas:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {gameData.forbidden.map(w => (
            <span key={w} className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
              {w}
            </span>
          ))}
        </div>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Escreva sua descrição aqui..."
        className="w-full border border-gray-300 rounded-lg p-3 h-32 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={submitted}
      />

      <button
        onClick={handleSubmit}
        disabled={submitted || answer.trim().length < 3}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitted ? 'Enviado!' : 'Enviar Resposta'}
      </button>
    </div>
  );
}
