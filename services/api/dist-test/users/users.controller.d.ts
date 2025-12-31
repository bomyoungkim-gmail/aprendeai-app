import { UsersService } from "./users.service";
import { UpdateProfileDto, UpdateSettingsDto, ChangePasswordDto } from "./dto/user.dto";
import { GetProfileUseCase } from "./application/get-profile.use-case";
import { UpdateProfileUseCase } from "./application/update-profile.use-case";
export declare class UsersController {
    private usersService;
    private getProfileUseCase;
    private updateProfileUseCase;
    constructor(usersService: UsersService, getProfileUseCase: GetProfileUseCase, updateProfileUseCase: UpdateProfileUseCase);
    getCurrentUser(req: any): Promise<{
        id: any;
        email: any;
        name: any;
        systemRole: any;
        contextRole: any;
        institution_id: any;
        createdAt: any;
        updatedAt: any;
        institutionId?: undefined;
    } | {
        id: any;
        name: any;
        email: any;
        systemRole: any;
        contextRole: any;
        institutionId: any;
        createdAt: any;
        updatedAt: any;
        institution_id?: undefined;
    }>;
    getUserContext(req: any): Promise<{
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
    updateProfile(req: any, updateDto: UpdateProfileDto): Promise<{
        id: any;
        email: any;
        name: any;
        systemRole: any;
        contextRole: any;
        institution_id: any;
        createdAt: any;
        updatedAt: any;
        institutionId?: undefined;
    } | {
        id: any;
        name: any;
        email: any;
        systemRole: any;
        contextRole: any;
        institutionId: any;
        createdAt: any;
        updatedAt: any;
        institution_id?: undefined;
    }>;
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        id: any;
        email: any;
        name: any;
        systemRole: any;
        contextRole: any;
        institution_id: any;
        createdAt: any;
        updatedAt: any;
        institutionId?: undefined;
    } | {
        id: any;
        name: any;
        email: any;
        systemRole: any;
        contextRole: any;
        institutionId: any;
        createdAt: any;
        updatedAt: any;
        institution_id?: undefined;
    }>;
    getStats(req: any): Promise<{
        contentsRead: number;
        annotationsCreated: number;
        groupsJoined: number;
        sessionsAttended: number;
        studyHours: number;
    }>;
    getActivity(req: any): Promise<({
        type: "annotation";
        description: string;
        timestamp: Date;
    } | {
        type: "group_join";
        description: string;
        timestamp: Date;
    })[]>;
    getSettings(req: any): Promise<string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | {
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
    getEntitlements(req: any): Promise<{
        id: string;
        userId: any;
        source: string;
        planType: string;
        limits: {
            maxContentsPerMonth: number;
            maxStorageMB: number;
        };
        features: {
            aiAssistant: boolean;
            advancedAnalytics: boolean;
        };
        effectiveAt: Date;
        expiresAt: any;
        updatedAt: Date;
    }>;
    updateSettings(req: any, settingsDto: UpdateSettingsDto): Promise<{
        id: any;
        email: any;
        name: any;
        systemRole: any;
        contextRole: any;
        institution_id: any;
        createdAt: any;
        updatedAt: any;
        institutionId?: undefined;
    } | {
        id: any;
        name: any;
        email: any;
        systemRole: any;
        contextRole: any;
        institutionId: any;
        createdAt: any;
        updatedAt: any;
        institution_id?: undefined;
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    deleteAccount(req: any, body: {
        password: string;
    }): Promise<{
        message: string;
    }>;
    exportData(req: any): Promise<{
        message: string;
        status: string;
    }>;
}
