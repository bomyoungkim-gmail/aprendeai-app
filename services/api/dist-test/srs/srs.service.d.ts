export type SrsStage = "NEW" | "D1" | "D3" | "D7" | "D14" | "D30" | "D60" | "MASTERED";
export type AttemptResult = "FAIL" | "HARD" | "OK" | "EASY";
export declare class SrsService {
    calculateNextDue(currentStage: SrsStage, result: AttemptResult): {
        newStage: SrsStage;
        dueDate: Date;
        daysToAdd: number;
        lapseIncrement: number;
    };
    private regressStage;
    private progressStage;
    getStageInterval(stage: SrsStage): number;
    calculateMasteryDelta(result: AttemptResult): number;
}
