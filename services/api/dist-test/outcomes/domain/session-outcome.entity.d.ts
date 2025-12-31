export declare class SessionOutcome {
    readingSessionId: string;
    comprehensionScore: number;
    productionScore: number;
    frustrationIndex: number;
    computedAt: Date;
    constructor(partial: Partial<SessionOutcome>);
}
