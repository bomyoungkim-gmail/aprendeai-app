'use client';

import { TextInputPlayer } from './TextInputPlayer';

interface FeynmanTeacherProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * FEYNMAN_TEACHER - Explain concept in simple terms
 * Uses TextInputPlayer template
 */
export function FeynmanTeacherGame({ onComplete }: FeynmanTeacherProps) {
  const concept = "Fotossíntese"; // Mock - would come from API

  const handleSubmit = (text: string) => {
    // Simple scoring: word count + simplicity
    const wordCount = text.split(' ').length;
    const hasSimpleWords = !/\b(complexo|avançado|sofisticado)\b/i.test(text);
    
    const score = Math.min(100, (wordCount >= 20 ? 50 : 0) + (hasSimpleWords ? 50 : 0));
    onComplete(score, score >= 70);
  };

  return (
    <TextInputPlayer
      prompt={`Explique "${concept}" como se estivesse ensinando para uma criança de 5 anos.`}
      placeholder="Use palavras simples e exemplos do dia a dia..."
      minWords={20}
      maxWords={150}
      onSubmit={handleSubmit}
    />
  );
}
