'use client';

import { TextInputPlayer } from './TextInputPlayer';

interface DebateMasterProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * DEBATE_MASTER - Argue a position
 * Uses TextInputPlayer template
 */
export function DebateMasterGame({ onComplete }: DebateMasterProps) {
  const topic = "Redes sociais fazem mais mal do que bem";
  const position = "A FAVOR";

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
      prompt={`Argumente ${position} da tese: "${topic}"`}
      placeholder="Apresente evidências, exemplos e conclusão..."
      minWords={30}
      maxWords={200}
      onSubmit={handleSubmit}
    />
  );
}
