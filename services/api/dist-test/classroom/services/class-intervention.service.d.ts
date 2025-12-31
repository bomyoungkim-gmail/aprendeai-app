import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomEventService } from "../../events/classroom-event.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
export declare class ClassInterventionService {
    private prisma;
    private classroomEventService;
    private promptLibrary;
    constructor(prisma: PrismaService, classroomEventService: ClassroomEventService, promptLibrary: PromptLibraryService);
    logHelpRequest(classroomId: string, learnerUserId: string, topic: string): Promise<{
        timestamp: Date;
        topic: string;
        status: string;
    }>;
    getInterventionPrompt(studentName: string, topic: string): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    canDo1on1(classroomId: string): Promise<boolean>;
    getPendingHelpRequests(classroomId: string): Promise<any[]>;
}
