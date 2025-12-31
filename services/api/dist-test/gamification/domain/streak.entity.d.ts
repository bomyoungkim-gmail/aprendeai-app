export declare class Streak {
    userId: string;
    currentStreak: number;
    bestStreak: number;
    lastGoalMetDate: Date | null;
    freezeTokens: number;
    updatedAt: Date;
    constructor(partial: Partial<Streak>);
}
