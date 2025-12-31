export declare enum UserSystemRole {
    ADMIN = "ADMIN",
    SUPPORT = "SUPPORT",
    USER = "USER"
}
export declare enum UserContextRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    TEACHER = "TEACHER",
    STUDENT = "STUDENT",
    PARENT = "PARENT",
    MEMBER = "MEMBER"
}
export interface UserProps {
    id: string;
    email: string;
    name?: string;
    passwordHash?: string | null;
    systemRole: UserSystemRole;
    contextRole: UserContextRole;
    institutionId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class User {
    readonly id: string;
    readonly email: string;
    name?: string;
    private _passwordHash?;
    systemRole: UserSystemRole;
    contextRole: UserContextRole;
    institutionId?: string | null;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(props: UserProps);
    get passwordHash(): string | null | undefined;
    updateProfile(name: string): void;
    updateContext(role: UserContextRole, institutionId?: string | null): void;
}
