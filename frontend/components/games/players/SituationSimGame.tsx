'use client';

import { MultipleChoicePlayer } from './MultipleChoicePlayer';

interface SituationSimProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * SITUATION_SIM - Solve situation problem
 * Uses MultipleChoicePlayer template
 */
export function SituationSimGame({ onComplete }: SituationSimProps) {
  const situation = "Você está em uma sala escura com 3 interruptores. Um deles controla uma lâmpada em outra sala. Você só pode entrar na outra sala UMA vez. Como descobrir qual interruptor controla a lâmpada?";
  
  const options = [
    { id: 'A', text: 'Ligar todos e verificar' },
    { id: 'B', text: 'Ligar o primeiro por 5min, desligar, ligar o segundo e verificar' },
    { id: 'C', text: 'Testar um por um' },
    { id: 'D', text: 'Impossível descobrir' },
  ];

  const handleSubmit = (answerId: string) => {
    const correct = answerId === 'B'; // Usa calor da lâmpada
    onComplete(correct ? 100 : 0, correct);
  };

  return (
    <MultipleChoicePlayer
      question={situation}
      options={options}
      correctId="B"
      onSubmit={handleSubmit}
    />
  );
}
