import { PrismaService } from "../prisma/prisma.service";
import { Prisma, users } from "@prisma/client";
import { UpdateProfileDto, UpdateSettingsDto } from "./dto/user.dto";
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(email: string): Promise<users | null>;
    findById(id: string): Promise<users | null>;
    getUserContext(userId: string): Promise<{
        userId: any;
        role: any;
        institutionId: any;
        institutionRole: any;
        familyId: any;
        familyRole: any;
        contentFilters: {
            minAge: number;
            maxAge: number;
        };
        screenTimeLimit: any;
    }>;
    createUser(data: Prisma.usersCreateInput): Promise<users>;
    updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<users>;
    updateAvatar(userId: string, avatarUrl: string): Promise<users>;
    getStats(userId: string): Promise<{
        contentsRead: number;
        annotationsCreated: number;
        groupsJoined: number;
        sessionsAttended: number;
        studyHours: number;
    }>;
    getActivity(userId: string, limit?: number): Promise<({
        type: "annotation";
        description: string;
        timestamp: Date;
    } | {
        type: "group_join";
        description: string;
        timestamp: Date;
    })[]>;
    getSettings(userId: string): Promise<string | number | true | Prisma.JsonObject | Prisma.JsonArray | {
        notifications: {
            email: true;
            groupInvites: true;
            annotations: true;
            sessionReminders: true;
            weeklyDigest: false;
        };
        privacy: {
            profileVisible: true;
            showStats: true;
            allowEmailDiscovery: true;
        };
    }>;
    updateSettings(userId: string, settingsDto: UpdateSettingsDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        email: string;
        bio: string | null;
        address: string | null;
        sex: string | null;
        birthday: Date | null;
        age: number | null;
        password_hash: string | null;
        system_role: import(".prisma/client").$Enums.SystemRole | null;
        last_context_role: import(".prisma/client").$Enums.ContextRole;
        last_institution_id: string | null;
        oauth_provider: string | null;
        oauth_id: string | null;
        oauth_picture: string | null;
        schooling_level: string | null;
        preferred_languages: Prisma.JsonValue;
        last_login_at: Date | null;
        status: string;
        avatar_url: string | null;
        settings: Prisma.JsonValue | null;
        sso_provider: string | null;
        sso_subject: string | null;
        password_reset_token: string | null;
        password_reset_expires: Date | null;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string, password: string): Promise<{
        message: string;
    }>;
}
