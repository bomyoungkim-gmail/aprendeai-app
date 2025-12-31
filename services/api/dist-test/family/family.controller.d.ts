import { FamilyService } from "./family.service";
import { FamilyPolicyService } from "./services/family-policy.service";
import { CoReadingService } from "./services/co-reading.service";
import { TeachBackService } from "./services/teachback.service";
import { FamilyDashboardService } from "./services/family-dashboard.service";
import { OpsCoachService } from "./services/ops-coach.service";
import { CreateFamilyDto } from "./dto/create-family.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { CreateFamilyPolicyDto } from "./dto/family-policy.dto";
import { StartCoSessionDto, StartTeachBackDto } from "./dto/co-session.dto";
import { users } from "@prisma/client";
export declare class FamilyController {
    private readonly familyService;
    private readonly policyService;
    private readonly coReadingService;
    private readonly teachBackService;
    private readonly dashboardService;
    private readonly opsCoachService;
    constructor(familyService: FamilyService, policyService: FamilyPolicyService, coReadingService: CoReadingService, teachBackService: TeachBackService, dashboardService: FamilyDashboardService, opsCoachService: OpsCoachService);
    create(dto: CreateFamilyDto, req: any): Promise<{
        id: string;
        name: string;
        joinCode: string;
        ownerUserId: any;
        createdAt: Date;
        updatedAt: Date;
        members: {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.FamilyRole;
            learningRole: any;
            status: import(".prisma/client").$Enums.FamilyMemberStatus;
            displayName: string;
            joinedAt: Date;
            user: {
                id: any;
                name: any;
                email: any;
            };
        }[];
        stats: {
            totalMembers: number;
            activeMembers: number;
            plan: string;
        };
    }>;
    findAll(user: users): Promise<{
        id: string;
        name: string;
        joinCode: string;
        ownerUserId: any;
        createdAt: Date;
        updatedAt: Date;
        members: {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.FamilyRole;
            learningRole: any;
            status: import(".prisma/client").$Enums.FamilyMemberStatus;
            displayName: string;
            joinedAt: Date;
            user: {
                id: any;
                name: any;
                email: any;
            };
        }[];
        stats: {
            totalMembers: number;
            activeMembers: number;
            plan: string;
        };
    }[]>;
    getMyFamily(req: any): Promise<{}>;
    findOne(id: string, user: users): Promise<{
        family_members: ({
            users: {
                id: string;
                name: string;
                email: string;
                avatar_url: string;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.FamilyRole;
            status: import(".prisma/client").$Enums.FamilyMemberStatus;
            user_id: string;
            joined_at: Date;
            family_id: string;
            learning_role: import(".prisma/client").$Enums.FamilyLearningRole | null;
            display_name: string | null;
        })[];
        users_owner: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string | null;
        owner_user_id: string;
        join_code: string | null;
    }>;
    invite(id: string, user: users, inviteDto: InviteMemberDto): Promise<{
        users: {
            id: string;
            name: string;
            email: string;
            avatar_url: string;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.FamilyRole;
        status: import(".prisma/client").$Enums.FamilyMemberStatus;
        user_id: string;
        joined_at: Date;
        family_id: string;
        learning_role: import(".prisma/client").$Enums.FamilyLearningRole | null;
        display_name: string | null;
    }>;
    acceptInvite(id: string, user: users): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.FamilyRole;
        status: import(".prisma/client").$Enums.FamilyMemberStatus;
        user_id: string;
        joined_at: Date;
        family_id: string;
        learning_role: import(".prisma/client").$Enums.FamilyLearningRole | null;
        display_name: string | null;
    }>;
    getUsage(id: string, user: users): Promise<{
        range: "today" | "7d" | "30d";
        metrics: Record<string, {
            quantity: number;
            cost: number;
            count: number;
        }>;
        recentEvents: {
            id: string;
            environment: import(".prisma/client").$Enums.Environment;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            created_at: Date;
            scope_type: import(".prisma/client").$Enums.ScopeType;
            scope_id: string;
            user_id: string | null;
            occurred_at: Date;
            provider_code: string | null;
            endpoint: string | null;
            metric: string;
            quantity: number;
            approx_cost_usd: number | null;
            request_id: string | null;
        }[];
        totalCost: number;
    }>;
    removeMember(id: string, memberUserId: string, user: users): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.FamilyRole;
        status: import(".prisma/client").$Enums.FamilyMemberStatus;
        user_id: string;
        joined_at: Date;
        family_id: string;
        learning_role: import(".prisma/client").$Enums.FamilyLearningRole | null;
        display_name: string | null;
    }>;
    transferOwnership(id: string, user: users, newOwnerId: string): Promise<{
        success: boolean;
    }>;
    setPrimary(id: string, user: users): Promise<{
        success: boolean;
    }>;
    deleteFamily(id: string, user: users): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string | null;
        owner_user_id: string;
        join_code: string | null;
    }>;
    createPolicy(dto: CreateFamilyPolicyDto): Promise<{
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
    getEducatorDashboard(familyId: string, learnerId: string): Promise<import("../privacy/types").EducatorDashboardData>;
    startCoSession(dto: StartCoSessionDto): Promise<{
        coSession: {
            id: string;
            familyId: string;
            learnerUserId: string;
            educatorUserId: string;
            readingSessionId: string;
            threadIdLearner: string;
            threadIdEducator: string;
            timeboxMin: number;
            type: import(".prisma/client").$Enums.CoSessionType;
            status: import(".prisma/client").$Enums.CoReadingStatus;
            startedAt: Date;
            endedAt: Date;
        };
        context: import("../state-machine/types").CoReadingContext;
        nextPrompts: {
            learner: import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
            educator: import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
        };
    }>;
    startTeachBack(dto: StartTeachBackDto): Promise<{
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
            child: import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
            parent: import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
        };
    }>;
    getPolicyConfirmationPrompt(policyId: string): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    finishCoSession(sessionId: string, body: {
        context: any;
    }): Promise<import("../state-machine/types").PhaseTransitionResult>;
    getCoSessionPrompt(sessionId: string, body: {
        phase: string;
    }): import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getTeachBackPrompt(sessionId: string, body: {
        step: number;
    }): import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt | {
        error: string;
    };
    finishTeachBackSession(sessionId: string, body: {
        stars: number;
    }): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    getWeeklyReportPrompt(body: {
        streak: number;
        compAvg: number;
    }): import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
}
