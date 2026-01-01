/**
 * SRS Review Hook for LANGUAGE Mode
 * 
 * Orchestration layer - manages SRS review state
 * Following MelhoresPraticas.txt: hooks/domain for orchestration
 * 
 * G6.3: Revisões integradas ao final da leitura
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SRSCard } from '@/lib/language/srs-manager';
import { useTelemetry } from '../telemetry/use-telemetry';
import api from '@/services/api';

interface UseSRSReviewProps {
  contentId: string;
  optIn?: boolean;
  blockingIfEvaluative?: boolean;
}

export function useSRSReview({ 
  contentId, 
  optIn = true,
  blockingIfEvaluative = true 
}: UseSRSReviewProps) {
  const [showReview, setShowReview] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewResults, setReviewResults] = useState<Record<string, 'correct' | 'incorrect'>>({});
  
  const { track } = useTelemetry(contentId);

  // Fetch due cards for review
  const { data: dueCards, isLoading } = useQuery({
    queryKey: ['srs-due-cards', contentId],
    queryFn: async (): Promise<SRSCard[]> => {
      const response = await api.get('/srs/due-cards', {
        params: { contentId }
      });
      return response.data;
    },
    enabled: showReview
  });

  // Submit review result
  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, correct }: { cardId: string; correct: boolean }) => {
      return await api.post(`/srs/cards/${cardId}/review`, { correct });
    },
    onSuccess: () => {
      toast.success('Revisão registrada');
    }
  });

  const startReview = useCallback(() => {
    setShowReview(true);
    setCurrentCardIndex(0);
    setReviewResults({});
    
    track('SRS_REVIEW_STARTED', {
      contentId,
      optIn,
      timestamp: Date.now()
    });
  }, [contentId, optIn, track]);

  const answerCard = useCallback((correct: boolean) => {
    if (!dueCards || currentCardIndex >= dueCards.length) return;

    const currentCard = dueCards[currentCardIndex];
    
    // Record result
    setReviewResults(prev => ({
      ...prev,
      [currentCard.word]: correct ? 'correct' : 'incorrect'
    }));

    // Submit to backend
    reviewMutation.mutate({
      cardId: currentCard.word, // Using word as ID for now
      correct
    });

    // Move to next card
    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      completeReview();
    }
  }, [dueCards, currentCardIndex, reviewMutation]);

  const completeReview = useCallback(() => {
    const totalCards = dueCards?.length || 0;
    const correctCount = Object.values(reviewResults).filter(r => r === 'correct').length;
    const score = totalCards > 0 ? correctCount / totalCards : 0;

    track('SRS_REVIEW_COMPLETE', {
      contentId,
      totalCards,
      correctCount,
      score,
      timestamp: Date.now()
    });

    setShowReview(false);
    toast.success(`Revisão completa: ${correctCount}/${totalCards} corretas`);
  }, [dueCards, reviewResults, contentId, track]);

  const skipReview = useCallback(() => {
    track('SRS_REVIEW_SKIPPED', {
      contentId,
      dueCardsCount: dueCards?.length || 0
    });
    
    setShowReview(false);
  }, [contentId, dueCards, track]);

  return {
    showReview,
    dueCards,
    currentCard: dueCards?.[currentCardIndex],
    currentCardIndex,
    totalCards: dueCards?.length || 0,
    reviewResults,
    isLoading,
    startReview,
    answerCard,
    skipReview,
    completeReview
  };
}
