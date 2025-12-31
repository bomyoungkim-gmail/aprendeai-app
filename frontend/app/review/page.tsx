"use client";

import React, { useState } from 'react';
import { useReviewQueue, useRecordAttempt } from '@/hooks/sessions/use-review';
import { FlashcardPlayer } from '@/components/review/FlashcardPlayer';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Trophy, Calendar, Sparkles } from 'lucide-react';
import { ReviewResult } from '@/lib/types/review';

export default function ReviewPage() {
  const router = useRouter();
  const [sessionStarted, setSessionStarted] = useState(false);
  const { data: queue = [], isLoading, isError } = useReviewQueue();
  const recordMutation = useRecordAttempt();

  const handleFinish = () => {
    setSessionStarted(false);
    router.push('/dashboard');
  };

  const handleAttempt = async (vocabId: string, result: ReviewResult) => {
    await recordMutation.mutateAsync({
      vocabId,
      dimension: 'MEANING', // Default dimension for simple reviews
      result,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500 font-medium">Preparando seu deck de estudos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-6 text-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-red-500/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ops! Algo deu errado</h2>
          <p className="text-gray-500 mb-6">Não conseguimos carregar suas revisões agora.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (sessionStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setSessionStarted(false)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-8 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Sair da Sessão
          </button>
          <FlashcardPlayer 
            items={queue} 
            onFinish={handleFinish}
            onAttempt={handleAttempt}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">
            <Sparkles className="w-4 h-4" />
            Repetição Espaçada
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
            Pronto para <br /> <span className="text-indigo-600">consolidar seu saber?</span>
          </h1>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Cartas Pendentes</h3>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{queue.length}</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Você tem {queue.length} termos para revisar hoje. Manter a consistência é a chave para a memória de longo prazo.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
               <Trophy className="w-8 h-8 text-yellow-500" />
               <span className="text-lg font-bold text-gray-900 dark:text-white">Dica do Dia</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed italic">
              "A revisão antes de dormir aumenta a retenção neural em até 40%."
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <button
            onClick={() => setSessionStarted(true)}
            disabled={queue.length === 0}
            className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 dark:shadow-none transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            Começar Revisão
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full md:w-auto px-12 py-5 text-gray-600 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
