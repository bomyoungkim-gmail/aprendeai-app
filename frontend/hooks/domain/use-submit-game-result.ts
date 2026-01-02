/**
 * Submit Game Result - Domain Hook
 * 
 * Orchestrates the complete flow of submitting a game result:
 * - Validation
 * - API call
 * - User feedback
 * - Navigation (optional)
 */

import { useSubmitGameResultMutation } from '@/hooks/data/use-games-data';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface SubmitGameResultParams {
  gameId: string;
  score: number;
  won: boolean;
  totalQuestions?: number;
  timeSpentSeconds?: number;
}

export function useSubmitGameResult() {
  const router = useRouter();
  const mutation = useSubmitGameResultMutation();
  
  const submitResult = async ({
    gameId,
    score,
    won,
    totalQuestions = 1,
    timeSpentSeconds = 0,
  }: SubmitGameResultParams) => {
    // Business validation
    if (!gameId) {
      toast.error('Game ID inválido');
      return false;
    }
    
    if (score < 0 || score > 100) {
      toast.error('Score deve estar entre 0 e 100');
      return false;
    }
    
    try {
      // Submit via data hook
      await mutation.mutateAsync({
        gameId,
        result: {
          score,
          totalQuestions,
          correctCount: won ? totalQuestions : 0,
          timeSpentSeconds,
        },
      });
      
      // Success feedback
      toast.success(won ? '🎉 Parabéns! Resultado salvo!' : 'Resultado salvo!');
      
      return true;
    } catch (error) {
      // Error handling
      console.error('Failed to submit game result:', error);
      toast.error('Erro ao salvar resultado. Tente novamente.');
      return false;
    }
  };
  
  return {
    submitResult,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
