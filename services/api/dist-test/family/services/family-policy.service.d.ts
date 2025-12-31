import { PrismaService } from "../../prisma/prisma.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { FamilyEventService } from "../../events/family-event.service";
import { CreateFamilyPolicyDto, UpdateFamilyPolicyDto } from "../dto/family-policy.dto";
export declare class FamilyPolicyService {
    private prisma;
    private promptLibrary;
    private familyEventService;
    constructor(prisma: PrismaService, promptLibrary: PromptLibraryService, familyEventService: FamilyEventService);
    create(dto: CreateFamilyPolicyDto): Promise<{
        id: string;
        familyId: string;
        learnerUserId: string;
        timeboxDefaultMin: number;
        dailyMinMinutes: number;
        dailyReviewCap: number;
        coReadingDays: number[];
        coReadingTime: string;
        toolWordsGateEnabled: boolean;
        privacyMode: import(".prisma/client").$Enums.PrivacyMode;
        updatedAt: Date;
    }>;
    getByFamilyAndLearner(familyId: string, learnerUserId: string): Promise<{
        id: string;
        familyId: string;
        learnerUserId: string;
        timeboxDefaultMin: number;
        dailyMinMinutes: number;
        dailyReviewCap: number;
        coReadingDays: number[];
        coReadingTime: string;
        toolWordsGateEnabled: boolean;
        privacyMode: import(".prisma/client").$Enums.PrivacyMode;
        updatedAt: Date;
    }>;
    update(familyId: string, learnerUserId: string, dto: UpdateFamilyPolicyDto): Promise<{
        id: string;
        familyId: string;
        learnerUserId: string;
        timeboxDefaultMin: number;
        dailyMinMinutes: number;
        dailyReviewCap: number;
        coReadingDays: number[];
        coReadingTime: string;
        toolWordsGateEnabled: boolean;
        privacyMode: import(".prisma/client").$Enums.PrivacyMode;
        updatedAt: Date;
    }>;
    getConfirmationPrompt(policyId: string): Promise<import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    getOnboardingPrompt(): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getPrivacyModePrompt(): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
}
