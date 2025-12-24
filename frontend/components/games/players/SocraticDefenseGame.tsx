'use client';

import { TextInputPlayer } from './TextInputPlayer';

interface SocraticDefenseProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * SOCRATIC_DEFENSE - Answer probing questions
 * Uses TextInputPlayer template
 */
export function SocraticDefenseGame({ onComplete }: SocraticDefenseProps) {
  const thesis = "Educação é o fator mais importante para o sucesso";
  const question = "Por que você acredita nisso? Que evidências você tem?";

  const handleSubmit = (text: string) => {
    // Score depth of thinking
    const hasReasoning = /porque|pois|já que/i.test(text);
    const hasEvidence = /exemplo|caso|estudo/i.test(text);
    const isDeep = text.length > 100;
    
    const score = (hasReasoning ? 35 : 0) + (hasEvidence ? 35 : 0) + (isDeep ? 30 : 0);
    onComplete(score, score >= 70);
  };

  return (
    <TextInputPlayer
      prompt={`Sua tese: "${thesis}"\n\nPergunta Socrática: ${question}`}
      placeholder="Responda com profundidade e exemplos..."
      minWords={25}
      maxWords={150}
      onSubmit={handleSubmit}
    />
  );
}
