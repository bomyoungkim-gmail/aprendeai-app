import { SessionPhase, SessionModality, AssetLayer } from "@prisma/client";
export declare class ReadingSession {
    id: string;
    userId: string;
    contentId: string;
    contentVersionId?: string;
    phase: SessionPhase;
    modality: SessionModality;
    assetLayer: AssetLayer;
    startTime: Date;
    finishedAt?: Date;
    goalStatement?: string;
    predictionText?: string;
    targetWordsJson?: any;
    createdAt: Date;
    updatedAt: Date;
    events?: SessionEvent[];
    outcomes?: SessionOutcome[];
    content?: {
        id: string;
        title: string;
        type: string;
        originalLanguage?: string;
    };
    constructor(partial: Partial<ReadingSession>);
    isFinished(): boolean;
}
export declare class SessionEvent {
    id: string;
    sessionId: string;
    eventType: string;
    payload: any;
    createdAt: Date;
}
export declare class SessionOutcome {
    sessionId: string;
    comprehensionScore: number;
    productionScore: number;
    frustrationIndex: number;
}
