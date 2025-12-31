import { families, family_members, users } from "@prisma/client";
export declare class FamilyMapper {
    static toDto(family: families & {
        family_members?: (family_members & {
            users: users;
        })[];
    }): {
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
    };
    static toCollectionDto(families: families[]): {
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
    }[];
}
