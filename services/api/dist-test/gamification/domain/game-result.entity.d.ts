export declare class GameResult {
    id: string;
    userId: string;
    contentId: string;
    gameType: string;
    score: number;
    metadata?: any;
    playedAt: Date;
    constructor(partial: Partial<GameResult>);
}
