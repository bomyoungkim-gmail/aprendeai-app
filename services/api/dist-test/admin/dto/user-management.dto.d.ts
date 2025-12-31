export declare class UserSearchDto {
    query?: string;
    status?: string;
    systemRole?: string;
    contextRole?: string;
    institutionId?: string;
    page?: number;
    limit?: number;
}
export declare class UpdateUserStatusDto {
    status: string;
    reason: string;
}
export declare class RoleAssignmentDto {
    role: string;
    scopeType?: string;
    scopeId?: string;
}
export declare class UpdateUserRolesDto {
    roles: RoleAssignmentDto[];
    reason: string;
}
export declare class ImpersonateUserDto {
    reason: string;
    durationMinutes?: number;
}
