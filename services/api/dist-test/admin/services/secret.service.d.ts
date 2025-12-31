import { PrismaService } from "../../prisma/prisma.service";
import { EncryptionService } from "./encryption.service";
import { Environment } from "@prisma/client";
export declare class SecretService {
    private prisma;
    private encryption;
    constructor(prisma: PrismaService, encryption: EncryptionService);
    listSecrets(filter?: {
        provider?: string;
        environment?: Environment;
    }): Promise<{
        maskedValue: string;
        provider: string;
        id: string;
        key: string;
        environment: import(".prisma/client").$Enums.Environment;
        created_at: Date;
        updated_at: Date;
        name: string;
        last_rotated_at: Date;
    }[]>;
    getSecret(id: string): Promise<{
        id: string;
        key: string;
        name: string;
        value: string;
        provider: string;
        environment: import(".prisma/client").$Enums.Environment;
        lastRotatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getSecretByKey(key: string): Promise<string | null>;
    createSecret(data: {
        key: string;
        name: string;
        value: string;
        provider?: string;
        environment?: string;
    }, createdBy: string): Promise<{
        id: string;
        key: string;
        name: string;
        maskedValue: string;
    }>;
    updateSecret(id: string, value: string, reason: string, actorUserId: string, actorRole: string, auditLogFn: (data: any) => Promise<any>): Promise<{
        id: string;
        key: string;
        name: string;
        maskedValue: string;
        lastRotatedAt: Date;
    }>;
    deleteSecret(id: string, reason: string, actorUserId: string, actorRole: string, auditLogFn: (data: any) => Promise<any>): Promise<{
        deleted: boolean;
    }>;
}
