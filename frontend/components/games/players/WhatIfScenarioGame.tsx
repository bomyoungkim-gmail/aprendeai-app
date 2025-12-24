'use client';

import { MultipleChoicePlayer } from './MultipleChoicePlayer';

interface WhatIfScenarioProps {
  onComplete: (score: number, won: boolean) => void;
}

/**
 * WHAT_IF_SCENARIO - Predict outcomes
 * Uses MultipleChoicePlayer template
 */
export function WhatIfScenarioGame({ onComplete }: WhatIfScenarioProps) {
  const scenario = "E se a gravidade da Terra diminuísse pela metade?";
  const options = [
    { id: 'A', text: 'Pularíamos mais alto e objetos seriam mais leves' },
    { id: 'B', text: 'A atmosfera escaparia e não poderíamos respirar' },
    { id: 'C', text: 'Os dias ficariam mais curtos' },
    { id: 'D', text: 'A temperatura aumentaria' },
  ];

  const handleSubmit = (answerId: string) => {
    const correct = answerId === 'A';
    onComplete(correct ? 100 : 0, correct);
  };

  return (
    <MultipleChoicePlayer
      question={scenario}
      options={options}
      correctId="A"
      onSubmit={handleSubmit}
    />
  );
}
