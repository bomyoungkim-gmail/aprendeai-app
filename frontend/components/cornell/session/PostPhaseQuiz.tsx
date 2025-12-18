import { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface PostPhaseQuizProps {
  questions: QuizQuestion[];
  onComplete?: (score: number) => void;
}

export function PostPhaseQuiz({ questions, onComplete }: PostPhaseQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    setShowExplanation(false);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setShowExplanation(false);
    }
  };

  const calculateResults = () => {
    const correctCount = questions.filter(
      (q) => selectedAnswers[q.id] === q.correct_answer
    ).length;
    const score = Math.round((correctCount / questions.length) * 100);
    
    setShowResults(true);
    onComplete?.(score);
  };

  const question = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[question?.id];
  const isCorrect = selectedAnswer === question?.correct_answer;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (!question) {
    return <div>Nenhuma questão disponível</div>;
  }

  if (showResults) {
    const correctCount = questions.filter(
      (q) => selectedAnswers[q.id] === q.correct_answer
    ).length;
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-center mb-6">
          Resultados do Quiz
        </h3>

        <div className="text-center mb-8">
          <div className={`text-6xl font-bold mb-2 ${
            score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {score}%
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {correctCount} de {questions.length} corretas
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const userAnswer = selectedAnswers[q.id];
            const correct = userAnswer === q.correct_answer;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-lg border-2 ${
                  correct
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  {correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium mb-1">Questão {idx + 1}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sua resposta: {userAnswer || '(não respondida)'}
                    </p>
                    {!correct && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Correta: {q.correct_answer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            setShowResults(false);
            setCurrentQuestion(0);
            setSelectedAnswers({});
          }}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Refazer Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6">
        {/* Question header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Questão {currentQuestion + 1} de {questions.length}
          </span>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <HelpCircle className="w-4 h-4" />
            {showExplanation ? 'Ocultar' : 'Ver'} Explicação
          </button>
        </div>

        {/* Question text */}
        <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const showCorrect = showExplanation && option === question.correct_answer;
            const showIncorrect = showExplanation && isSelected && !isCorrect;

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(question.id, option)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  showCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : showIncorrect
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Explicação:
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {question.explanation}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Próxima'}
          </button>
        </div>
      </div>
    </div>
  );
}
