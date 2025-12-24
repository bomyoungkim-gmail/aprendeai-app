export interface GameProgressDto {
  gameId: string;
  stars: number;
  bestScore: number;
  totalPlays: number;
  streak: number;
  lastPlayed: Date | null;
}

export interface UpdateGameProgressDto {
  score: number;
  stars?: number;
  won?: boolean;
}

export interface GameProgressSummary {
  totalGamesPlayed: number;
  totalStars: number;
  favoriteGame: string | null;
  currentStreak: number;
  gamesProgress: GameProgressDto[];
}
