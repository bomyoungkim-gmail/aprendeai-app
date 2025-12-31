import { PrismaService } from "../../prisma/prisma.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { FamilyEventService } from "../../events/family-event.service";
import { StartTeachBackDto } from "../dto/co-session.dto";
export declare class TeachBackService {
    private prisma;
    private promptLibrary;
    private familyEventService;
    constructor(prisma: PrismaService, promptLibrary: PromptLibraryService, familyEventService: FamilyEventService);
    offerMission(childUserId: string): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    start(dto: StartTeachBackDto): Promise<{
        session: {
            id: string;
            type: import(".prisma/client").$Enums.CoSessionType;
            status: import(".prisma/client").$Enums.CoReadingStatus;
            family_id: string;
            learner_user_id: string;
            educator_user_id: string;
            reading_session_id: string;
            thread_id_learner: string;
            thread_id_educator: string;
            timebox_min: number;
            started_at: Date;
            ended_at: Date | null;
        };
        nextPrompts: {
            child: import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
            parent: import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
        };
    }>;
    getStep2Prompt(): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getStep3Prompt(): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    calculateStars(usedTargetWords: boolean, askedOpenQuestions: boolean): number;
    finish(sessionId: string, stars: number): Promise<import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
}
