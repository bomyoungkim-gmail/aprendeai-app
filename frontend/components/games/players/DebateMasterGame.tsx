import { useState, useMemo } from 'react';

import { TextInputPlayer } from './TextInputPlayer';
import { GameQuestion } from '@/lib/api/games';

interface DebateMasterProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * DEBATE_MASTER - Argue a position
 * Uses TextInputPlayer template
 */
export function DebateMasterGame({ onComplete, questions }: DebateMasterProps) {
  // Map Backend Data
  const gameData = useMemo(() => {
    if (questions && questions.length > 0) {
      return {
        topic: questions[0].text,
        position: 'A FAVOR' // Could be dynamic if we have a field or extract it
      };
    }
    return {
      topic: "Redes sociais fazem mais mal do que bem",
      position: "A FAVOR"
    };
  }, [questions]);

  const handleSubmit = (text: string) => {
    // Score based on argument structure
    const hasEvidence = /estudo|pesquisa|dado|estatística/i.test(text);
    const hasExamples = text.split(',').length >= 2;
    const hasConclusion = /portanto|logo|concluindo/i.test(text);
    
    const score = (hasEvidence ? 40 : 0) + (hasExamples ? 30 : 0) + (hasConclusion ? 30 : 0);
    onComplete(score, score >= 70);
  };

  return (
    <TextInputPlayer
      prompt={`Argumente ${gameData.position} da tese: "${gameData.topic}"`}
      placeholder="Apresente evidências, exemplos e conclusão..."
      minWords={30}
      maxWords={200}
      onSubmit={handleSubmit}
    />
  );
}
