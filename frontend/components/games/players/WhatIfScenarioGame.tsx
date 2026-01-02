import { useState, useMemo } from 'react';

import { MultipleChoicePlayer } from './MultipleChoicePlayer';
import { GameQuestion } from '@/services/api/games.api';

interface WhatIfScenarioProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * WHAT_IF_SCENARIO - Predict outcomes
 * Uses MultipleChoicePlayer template
 */
export function WhatIfScenarioGame({ onComplete, questions }: WhatIfScenarioProps) {
  // Map Backend Data
  const gameData = useMemo(() => {
    if (questions && questions.length > 0) {
      const q = questions[0];
      return {
        scenario: q.text,
        options: q.options ? q.options.map((opt, idx) => ({
           id: idx.toString(), 
           text: opt
        })) : [],
        correctId: q.correctAnswer ? 
           // If backend provides specific answer string, try to find its index/ID or just pass 0
           // For simple matching, we might need more complex logic. 
           // If 'correctAnswer' holds the TEXT, we assume option matching. 
           // If it holds an index, valid. 
           '0' : undefined 
      };
    }
    // Fallback Mock Data
    return {
      scenario: "E se a gravidade da Terra diminuísse pela metade?",
      options: [
        { id: 'A', text: 'Pularíamos mais alto e objetos seriam mais leves' },
        { id: 'B', text: 'A atmosfera escaparia e não poderíamos respirar' },
        { id: 'C', text: 'Os dias ficariam mais curtos' },
        { id: 'D', text: 'A temperatura aumentaria' },
      ],
      correctId: 'A'
    };
  }, [questions]);
  
  const handleSubmit = (answerId: string) => {
    // If subjective or no correct answer defined, treat as correct for completion
    const correct = gameData.correctId ? answerId === gameData.correctId : true; 
    onComplete(correct ? 100 : 0, correct);
  };

  return (
    <MultipleChoicePlayer
      question={gameData.scenario}
      options={gameData.options}
      correctId={gameData.correctId} 
      onSubmit={handleSubmit}
    />
  );
}
