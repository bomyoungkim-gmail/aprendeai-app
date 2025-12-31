import { PromptLibraryService } from "../../prompts/prompt-library.service";
export declare class OpsCoachService {
    private promptLibrary;
    constructor(promptLibrary: PromptLibraryService);
    getDailyBootLearner(): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getDailyBootEducator(coReadingDays: number[]): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getQueueNext(title: string, estMin: number): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getTimeLogPrompt(): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getDailyCloseLearner(): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getWeeklyReportEducator(streak: number, compAvg: number): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    hasDailyBootCompleted(userId: string, date: Date): Promise<boolean>;
    suggestNextAction(hasDailyBoot: boolean, isCoReadingDay: boolean, queueItem?: {
        title: string;
        estMin: number;
    }): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
}
