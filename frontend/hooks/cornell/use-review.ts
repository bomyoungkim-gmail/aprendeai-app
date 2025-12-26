'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface VocabItem {
  id: string;
  word: string;
  language: string;
  srsStage: string;
  dueAt: string;
  lapsesCount: number;
  masteryForm: number;
  masteryMeaning: number;
  masteryUse: number;
  meaningNote?: string;
  exampleNote?: string;
  content?: {
    id: string;
    title: string;
  };
}

interface ReviewQueue {
  vocab: VocabItem[];
  cues: any[];
  stats: {
    totalDue: number;
    cap: number;
    vocabCount: number;
    cuesCount: number;
  };
}

export function useReview() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch review queue
  const { data: queue, isLoading, error } = useQuery<ReviewQueue>({
    queryKey: ['review-queue'],
    queryFn: async () => {
      const { data } = await api.get('/review/queue');
      return data;
    },
  });

  // Record vocab attempt mutation
  const attemptMutation = useMutation({
    mutationFn: async ({
      vocabId,
      dimension,
      result,
    }: {
      vocabId: string;
      dimension: 'FORM' | 'MEANING' | 'USE';
      result: 'FAIL' | 'HARD' | 'OK' | 'EASY';
    }) => {
      const { data } = await api.post('/review/vocab/attempt', {
        vocabId,
        dimension,
        result,
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate queue to get updated items
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      
      // Move to next card
      if (queue && currentIndex < queue.vocab.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
  });

  // Submit attempt
  const submitAttempt = useCallback(
    async (
      vocabId: string,
      result: 'FAIL' | 'HARD' | 'OK' | 'EASY',
      dimension: 'FORM' | 'MEANING' | 'USE' = 'MEANING',
    ) => {
      await attemptMutation.mutateAsync({ vocabId, dimension, result });
    },
    [attemptMutation],
  );

  // Navigate cards
  const nextCard = useCallback(() => {
    if (queue && currentIndex < queue.vocab.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [queue, currentIndex]);

  const previousCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const resetQueue = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  return {
    queue,
    isLoading,
    error,
    currentIndex,
    currentItem: queue?.vocab[currentIndex],
    submitAttempt,
    nextCard,
    previousCard,
    resetQueue,
    isSubmitting: attemptMutation.isPending,
    hasMore: queue ? currentIndex < queue.vocab.length - 1 : false,
    hasPrevious: currentIndex > 0,
    progress: queue
      ? {
          current: currentIndex + 1,
          total: queue.vocab.length,
          percentage: Math.round(((currentIndex + 1) / queue.vocab.length) * 100),
        }
      : null,
  };
}
