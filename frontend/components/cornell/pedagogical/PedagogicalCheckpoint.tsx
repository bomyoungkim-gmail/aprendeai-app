import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Question {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TEXT' | 'IDENTIFICATION';
  options?: string[];
  correctAnswer: any;
}

interface Assessment {
  id: string;
  questions: Question[];
}

interface PedagogicalCheckpointProps {
  contentId: string;
  isBlocking?: boolean;
  onComplete: (score: number) => void;
  onDismiss: () => void;
}

/**
 * PedagogicalCheckpoint
 * 
 * Component to display knowledge checks (E2.1-E2.3).
 * Blocks interaction if isBlocking is true.
 */
export function PedagogicalCheckpoint({
  contentId,
  isBlocking = false,
  onComplete,
  onDismiss
}: PedagogicalCheckpointProps) {
  const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'result'>('intro');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);

  // Fetch assessment for this content
  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['assessment', contentId],
    queryFn: async (): Promise<Assessment> => {
       // Temporarily using a filter/find approach or hardcoded if API not ready
       const response = await api.get(`/assessment?contentId=${contentId}`);
       // If no specialized assessment found, fallback to generic content-based ones if possible
       return response.data[0] || { id: 'fallback', questions: [] }; 
    },
  });

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    if (!assessment) return 0;
    let correct = 0;
    assessment.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return correct / assessment.questions.length;
  };

  const handleSubmit = () => {
    const score = calculateScore();
    const duration = Date.now() - startTime;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // H1.10: Telemetry - Checkpoint Answered
    if (typeof window !== 'undefined' && (window as any).telemetryClient) {
      (window as any).telemetryClient.track('CHECKPOINT_ANSWERED', {
        contentId,
        assessmentId: assessment?.id,
        score,
        latencyMs: duration,
        attempts: newAttempts,
        isBlocking,
        timestamp: Date.now()
      });
    }

    onComplete(score);
    setCurrentStep('result');
  };

  if (isLoading) return null; // Or a subtle loader
  if (error || !assessment || assessment.questions.length === 0) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/20">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 dark:bg-purple-900 p-1.5 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              {isBlocking ? 'Checkpoint Obrigatório' : 'Pausa para Reflexão'}
            </h3>
          </div>
          {!isBlocking && (
            <button onClick={onDismiss} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'intro' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {isBlocking 
                  ? 'Para garantir que você está acompanhando bem o conteúdo, responda a estas perguntas rápidas antes de continuar.'
                  : 'Que tal testar o que você acabou de ler? É rápido e ajuda na memorização!'}
              </p>
              <button 
                onClick={() => setCurrentStep('questions')}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                Começar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentStep === 'questions' && (
            <div className="space-y-6">
              {assessment.questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {idx + 1}. {q.questionText}
                  </p>
                  {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                    <div className="grid gap-2">
                      {q.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswer(q.id, optIdx)}
                          className={`text-left p-3 rounded-xl border-2 transition-all ${
                            answers[q.id] === optIdx
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                              : 'border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4">
                <button 
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < assessment.questions.length}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}

          {currentStep === 'result' && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bom trabalho!</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Você completou este desafio. Continue assim para dominar o conteúdo!
              </p>
              <button 
                onClick={() => onComplete(calculateScore())}
                className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold transition-all"
              >
                Continuar Leitura
              </button>
            </div>
          )}
        </div>

        {/* E2.3: Explanatory Banner */}
        {isBlocking && currentStep !== 'result' && (
          <div className="px-6 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
              Acesso bloqueado até conclusão
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
