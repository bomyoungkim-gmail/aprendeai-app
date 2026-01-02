import { useState, useMemo } from 'react';

import { TextInputPlayer } from './TextInputPlayer';
import { GameQuestion } from '@/services/api/games.api';

interface SocraticDefenseProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * SOCRATIC_DEFENSE - Answer probing questions
 * Uses TextInputPlayer template
 */
export function SocraticDefenseGame({ onComplete, questions }: SocraticDefenseProps) {
  // Map Backend Data
  const gameData = useMemo(() => {
    if (questions && questions.length > 0) {
      return {
        thesis: questions[0].text,
        question: questions[0].explanation || "Por que você acredita nisso? Que evidências você tem?"
      };
    }
    return {
      thesis: "Educação é o fator mais importante para o sucesso",
      question: "Por que você acredita nisso? Que evidências você tem?"
    };
  }, [questions]);

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
      prompt={`Sua tese: "${gameData.thesis}"\n\nPergunta Socrática: ${gameData.question}`}
      placeholder="Responda com profundidade e exemplos..."
      minWords={25}
      maxWords={150}
      onSubmit={handleSubmit}
    />
  );
}
