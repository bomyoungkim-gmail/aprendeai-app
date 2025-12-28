import { useState, useMemo } from 'react';

import { TextInputPlayer } from './TextInputPlayer';
import { GameQuestion } from '@/lib/api/games';

interface AnalogyMakerProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * ANALOGY_MAKER - Create analogy for concept
 * Uses TextInputPlayer template
 */
export function AnalogyMakerGame({ onComplete, questions }: AnalogyMakerProps) {
  // Map Backend Data
  const concept = useMemo(() => {
    if (questions && questions.length > 0) return questions[0].text;
    return "Internet"; // Mock
  }, [questions]);

  const handleSubmit = (text: string) => {
    // Score based on analogy quality
    const hasComparison = /como|igual|semelhante|parecido/i.test(text);
    const hasExplanation = text.split('.').length >= 2;
    
    const score = (hasComparison ? 50 : 0) + (hasExplanation ? 50 : 0);
    onComplete(score, score >= 70);
  };

  return (
    <TextInputPlayer
      prompt={`Crie uma analogia para explicar: "${concept}"`}
      placeholder="Ex: Internet é como uma biblioteca gigante..."
      minWords={15}
      maxWords={100}
      onSubmit={handleSubmit}
    />
  );
}
