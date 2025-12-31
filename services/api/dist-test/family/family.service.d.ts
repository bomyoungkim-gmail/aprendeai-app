import { PrismaService } from "../prisma/prisma.service";
import { CreateFamilyDto } from "./dto/create-family.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { ScopeType } from "@prisma/client";
import { SubscriptionService } from "../billing/subscription.service";
import { UsageTrackingService } from "../billing/usage-tracking.service";
import { IFamilyRepository } from "./domain/family.repository.interface";
import { CreateFamilyUseCase } from "./application/use-cases/create-family.use-case";
export declare class FamilyService {
    private prisma;
    private subscriptionService;
    private usageTracking;
    private readonly repository;
    private readonly createFamilyUseCase;
    constructor(prisma: PrismaService, subscriptionService: SubscriptionService, usageTracking: UsageTrackingService, repository: IFamilyRepository, createFamilyUseCase: CreateFamilyUseCase);
    create(userId: string, dto: CreateFamilyDto): Promise<import("./domain/family.entity").Family>;
    findAllForUser(userId: string): Promise<({
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
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string | null;
        owner_user_id: string;
        join_code: string | null;
    })[]>;
    findOne(familyId: string, userId: string): Promise<{
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
    inviteMember(familyId: string, userId: string, dto: InviteMemberDto): Promise<{
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
    removeMember(familyId: string, userId: string, memberUserIdToRemove: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.FamilyRole;
        status: import(".prisma/client").$Enums.FamilyMemberStatus;
        user_id: string;
        joined_at: Date;
        family_id: string;
        learning_role: import(".prisma/client").$Enums.FamilyLearningRole | null;
        display_name: string | null;
    }>;
    acceptInvite(familyId: string, userId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.FamilyRole;
        status: import(".prisma/client").$Enums.FamilyMemberStatus;
        user_id: string;
        joined_at: Date;
        family_id: string;
        learning_role: import(".prisma/client").$Enums.FamilyLearningRole | null;
        display_name: string | null;
    }>;
    getAnalytics(familyId: string, userId: string): Promise<{
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
    resolveBillingHierarchy(userId: string): Promise<{
        scopeType: ScopeType;
        scopeId: string;
    }[]>;
    setPrimaryFamily(userId: string, familyId: string): Promise<{
        success: boolean;
    }>;
    transferOwnership(familyId: string, currentOwnerId: string, newOwnerId: string): Promise<{
        success: boolean;
    }>;
    deleteFamily(familyId: string, userId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string | null;
        owner_user_id: string;
        join_code: string | null;
    }>;
    getFamilyForOwner(userId: string): Promise<{
        stats: {
            totalMembers: number;
            activeMembers: number;
            plan: string;
        };
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
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string | null;
        owner_user_id: string;
        join_code: string | null;
    }>;
}
