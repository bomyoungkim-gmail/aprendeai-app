import { useState, useMemo } from 'react';

import { MultipleChoicePlayer } from './MultipleChoicePlayer';
import { GameQuestion } from '@/services/api/games.api';

interface SituationSimProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * SITUATION_SIM - Solve situation problem
 * Uses MultipleChoicePlayer template
 */
export function SituationSimGame({ onComplete, questions }: SituationSimProps) {
  // Map Backend Data
  const gameData = useMemo(() => {
    if (questions && questions.length > 0) {
      const q = questions[0];
      return {
        situation: q.text,
        options: q.options ? q.options.map((opt, idx) => ({
           id: idx.toString(), 
           text: opt
        })) : [],
        correctId: q.correctAnswer || '0' // Backend should provide logic or we assume first
      };
    }
    // Fallback Mock Data
    return {
      situation: "Você está em uma sala escura com 3 interruptores. Um deles controla uma lâmpada em outra sala. Você só pode entrar na outra sala UMA vez. Como descobrir qual interruptor controla a lâmpada?",
      options: [
        { id: 'A', text: 'Ligar todos e verificar' },
        { id: 'B', text: 'Ligar o primeiro por 5min, desligar, ligar o segundo e verificar' },
        { id: 'C', text: 'Testar um por um' },
        { id: 'D', text: 'Impossível descobrir' },
      ],
      correctId: 'B'
    };
  }, [questions]);

  const handleSubmit = (answerId: string) => {
    const correct = answerId === gameData.correctId; 
    onComplete(correct ? 100 : 0, correct);
  };

  return (
    <MultipleChoicePlayer
      question={gameData.situation}
      options={gameData.options}
      correctId={gameData.correctId}
      onSubmit={handleSubmit}
    />
  );
}
