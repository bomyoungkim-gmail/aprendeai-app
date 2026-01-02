import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight } from 'lucide-react';

interface DidacticPostPhaseProps {
  contentId: string;
  onComplete: () => void;
}

/**
 * DidacticPostPhase
 * 
 * G2.4: Post-reading synthesis and self-assessment for DIDACTIC mode.
 * Prompts users to synthesize what they learned and reflect on their understanding.
 */
export function DidacticPostPhase({ contentId, onComplete }: DidacticPostPhaseProps) {
  const [currentStep, setCurrentStep] = useState<'synthesis' | 'self-assessment' | 'complete'>('synthesis');
  const [synthesisText, setSynthesisText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [selfAssessment, setSelfAssessment] = useState<{
    understanding: number;
    confidence: number;
    needsReview: boolean;
  }>({
    understanding: 3,
    confidence: 3,
    needsReview: false
  });

  // G2.4: AI-powered synthesis prompt
  const generateSuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      // Call AI service to generate synthesis prompt
      const response = await fetch(`/api/v1/ai/synthesis-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId })
      });
      const data = await response.json();
      setAiSuggestion(data.suggestion || 'Resuma os principais conceitos que você aprendeu.');
    } catch (error) {
      setAiSuggestion('Resuma os principais conceitos que você aprendeu.');
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleSynthesisSubmit = () => {
    setCurrentStep('self-assessment');
  };

  const handleSelfAssessmentSubmit = () => {
    setCurrentStep('complete');
    // Track telemetry
    if (typeof window !== 'undefined' && (window as any).telemetryClient) {
      (window as any).telemetryClient.track('DIDACTIC_POST_COMPLETE', {
        contentId,
        synthesisLength: synthesisText.length,
        understanding: selfAssessment.understanding,
        confidence: selfAssessment.confidence,
        needsReview: selfAssessment.needsReview,
        timestamp: Date.now()
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-900/20">
          <div className="bg-indigo-100 dark:bg-indigo-900 p-1.5 rounded-lg">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            Reflexão Final
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'synthesis' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Sintetize o que você aprendeu
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Em suas próprias palavras, resuma os principais conceitos e ideias que você absorveu desta leitura.
                </p>

                {/* AI Suggestion */}
                {!aiSuggestion && !isLoadingSuggestion && (
                  <button
                    onClick={generateSuggestion}
                    className="mb-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>✨</span> Precisa de ajuda? Gerar sugestão com IA
                  </button>
                )}

                {isLoadingSuggestion && (
                  <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                    Gerando sugestão...
                  </div>
                )}

                {aiSuggestion && (
                  <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">💡 Sugestão da IA:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{aiSuggestion}</p>
                  </div>
                )}

                <textarea
                  value={synthesisText}
                  onChange={(e) => setSynthesisText(e.target.value)}
                  className="w-full h-32 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 outline-none resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="Digite sua síntese aqui..."
                />
              </div>
              <button
                onClick={handleSynthesisSubmit}
                disabled={synthesisText.length < 50}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentStep === 'self-assessment' && (
            <div className="space-y-6">
              <div>
                <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Quanto você entendeu do conteúdo?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelfAssessment(prev => ({ ...prev, understanding: level }))}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        selfAssessment.understanding === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Pouco</span>
                  <span>Muito</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Quão confiante você está para aplicar esse conhecimento?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelfAssessment(prev => ({ ...prev, confidence: level }))}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        selfAssessment.confidence === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Nada confiante</span>
                  <span>Muito confiante</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <input
                  type="checkbox"
                  id="needsReview"
                  checked={selfAssessment.needsReview}
                  onChange={(e) => setSelfAssessment(prev => ({ ...prev, needsReview: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="needsReview" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Gostaria de revisar este conteúdo novamente
                </label>
              </div>

              <button
                onClick={handleSelfAssessmentSubmit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
              >
                Finalizar
              </button>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Parabéns!</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Você completou a leitura didática. Suas reflexões foram registradas.
              </p>
              <button
                onClick={onComplete}
                className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold transition-all"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
