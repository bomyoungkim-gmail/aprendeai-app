import { Language } from "@prisma/client";
export declare enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"
}
export declare class UpdateProfileDto {
    name?: string;
    bio?: string;
    nativeLanguage?: Language;
    learningLanguages?: Language[];
    schoolingLevel?: string;
    address?: string;
    sex?: Gender;
    birthday?: string;
    age?: number;
}
export declare class UpdateSettingsDto {
    notifications?: {
        email?: boolean;
        groupInvites?: boolean;
        annotations?: boolean;
        sessionReminders?: boolean;
        weeklyDigest?: boolean;
    };
    privacy?: {
        profileVisible?: boolean;
        showStats?: boolean;
        allowEmailDiscovery?: boolean;
    };
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class ChangeEmailDto {
    newEmail: string;
    password: string;
}
