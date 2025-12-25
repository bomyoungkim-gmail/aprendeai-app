// Types matching the backend DTOs

export interface GameQuestion {
  id: string;
  gameType: string;
  topic: string;
  question: any;
  answer: any;
  difficulty: number;
}

export interface TabooQuestion extends GameQuestion {
  question: {
    targetWord: string;
    forbiddenWords: string[];
  };
}

export interface QuizQuestion extends GameQuestion {
  question: {
    question: string;
    options: Array<{ id: string; text: string }>;
  };
}

// Add other game types as needed...
