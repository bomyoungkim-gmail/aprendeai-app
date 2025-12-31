export class GameProgress {
  id: string;
  userId: string;
  gameId: string;
  stars: number;
  bestScore: number;
  totalPlays: number;
  streak: number;
  lastPlayed: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<GameProgress>) {
    Object.assign(this, partial);
  }
}
