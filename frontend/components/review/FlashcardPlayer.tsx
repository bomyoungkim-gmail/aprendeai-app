import React, { useState } from 'react';
import { ReviewQueueItem, ReviewResult } from '@/lib/types/review';
import { ChevronRight, RotateCcw, Check, Zap, AlertCircle } from 'lucide-react';

interface FlashcardPlayerProps {
  items: ReviewQueueItem[];
  onFinish: () => void;
  onAttempt: (vocabId: string, result: ReviewResult) => Promise<void>;
}

export const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({
  items,
  onFinish,
  onAttempt
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <Check className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tudo pronto!</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Você revisou todas as cartas por hoje. Volte mais tarde para continuar sua jornada!
        </p>
        <button
          onClick={onFinish}
          className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  const handleRating = async (result: ReviewResult) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await onAttempt(currentItem.vocabId, result);
      
      if (currentIndex < items.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } else {
        onFinish();
      }
    } catch (err) {
      console.error('Failed to record attempt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-8 px-4">
        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          <span>Sessão de Revisão</span>
          <span>{currentIndex + 1} de {items.length}</span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card Wrapper */}
      <div className="relative perspective-1000 min-h-[400px]">
        <div 
          className={`relative w-full h-[400px] transition-all duration-500 transform-style-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={() => !isSubmitting && setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center">
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6">
              {currentItem.dimension}
            </span>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
              {currentItem.front}
            </h2>
            <p className="text-gray-400 text-sm animate-pulse mt-8">Clique para ver a resposta</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center ring-4 ring-indigo-500/10">
            <h3 className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-6">
              {currentItem.back}
            </h3>
            {currentItem.example && (
              <p className="text-gray-600 dark:text-gray-300 italic text-lg leading-relaxed max-w-sm">
                "{currentItem.example}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`mt-12 grid grid-cols-4 gap-3 transition-all duration-300 ${
        isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <button
          disabled={isSubmitting}
          onClick={() => handleRating('FAIL')}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all group"
        >
          <RotateCcw className="w-5 h-5 group-active:rotate-[-45deg] transition-transform" />
          <span className="text-[10px] font-bold uppercase">Errei</span>
        </button>

        <button
          disabled={isSubmitting}
          onClick={() => handleRating('HARD')}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-orange-100 dark:border-orange-900/30 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-500 transition-all group"
        >
          <AlertCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Difícil</span>
        </button>

        <button
          disabled={isSubmitting}
          onClick={() => handleRating('OK')}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900/30 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500 transition-all group"
        >
          <Check className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Bom</span>
        </button>

        <button
          disabled={isSubmitting}
          onClick={() => handleRating('EASY')}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 transition-all group"
        >
          <Zap className="w-5 h-5 group-hover:scale-110" />
          <span className="text-[10px] font-bold uppercase">Fácil</span>
        </button>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};
