export declare class PrePhaseDto {
    goalStatement: string;
    predictionText: string;
    targetWordsJson: string[];
}
export declare class RecordEventDto {
    eventType: "MARK_UNKNOWN_WORD" | "MARK_KEY_IDEA" | "CHECKPOINT_RESPONSE" | "QUIZ_RESPONSE" | "PRODUCTION_SUBMIT";
    payload: any;
}
export declare class AdvancePhaseDto {
    toPhase: "POST" | "FINISHED";
}
