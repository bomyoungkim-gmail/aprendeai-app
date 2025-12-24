'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GameProgress {
  gameId: string;
  stars: number;
  bestScore: number;
  totalPlays: number;
  streak: number;
  lastPlayed: Date | null;
}

interface GameContextType {
  currentGameId: string | null;
  isPlaying: boolean;
  progress: GameProgress | null;
  
  // Actions
  startGame: (gameId: string) => void;
  endGame: () => void;
  updateProgress: (gameId: string, score: number, won: boolean) => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<GameProgress | null>(null);

  const startGame = useCallback((gameId: string) => {
    setCurrentGameId(gameId);
    setIsPlaying(true);
  }, []);

  const endGame = useCallback(() => {
    setCurrentGameId(null);
    setIsPlaying(false);
  }, []);

  const updateProgress = useCallback(async (gameId: string, score: number, won: boolean) => {
    try {
      const response = await fetch(`/api/games/progress/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score, won }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProgress(updated);
        return updated;
      }
    } catch (error) {
      console.error('[GameContext] Failed to update progress:', error);
      throw error;
    }
  }, []);

  return (
    <GameContext.Provider
      value={{
        currentGameId,
        isPlaying,
        progress,
        startGame,
        endGame,
        updateProgress,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
