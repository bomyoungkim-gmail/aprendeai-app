import { User } from "../domain/user.entity";
interface PrismaUser {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    system_role: string;
    last_context_role: string;
    last_institution_id?: string | null;
    created_at: Date;
    updated_at: Date;
    [key: string]: any;
}
export declare class UserMapper {
    static toDomain(raw: PrismaUser): User;
    static toDto(user: User | any | null): {
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
    };
}
export {};
