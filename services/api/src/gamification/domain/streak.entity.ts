export class Streak {
  userId: string; // PK
  currentStreak: number;
  bestStreak: number;
  lastGoalMetDate: Date | null;
  freezeTokens: number;
  updatedAt: Date;

  constructor(partial: Partial<Streak>) {
    Object.assign(this, partial);
  }
}
