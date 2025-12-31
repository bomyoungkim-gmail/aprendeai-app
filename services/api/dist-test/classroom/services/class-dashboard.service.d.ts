import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomPrivacyGuard } from "../../privacy/classroom-privacy-guard.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { ClassPrivacyMode, StudentData } from "../../privacy/types";
export declare class ClassDashboardService {
    private prisma;
    private privacyGuard;
    private promptLibrary;
    constructor(prisma: PrismaService, privacyGuard: ClassroomPrivacyGuard, promptLibrary: PromptLibraryService);
    getTeacherDashboard(classroomId: string): Promise<{
        classroomId: string;
        className: string;
        activeStudents: number;
        avgProgress: number;
        students: StudentData[];
        privacyMode: ClassPrivacyMode;
    }>;
    private calculateStudentStats;
    getDashboardPrompt(activeCount: number, avgComprehension: number): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
}
