import { Cache } from "cache-manager";
import { PrismaService } from "../../prisma/prisma.service";
export declare class ContentAccessService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: Cache);
    canAccessContent(contentId: string, userId: string): Promise<boolean>;
    private _checkAccess;
    private isOwner;
    private hasFamilyAccess;
    private hasInstitutionAccess;
    canAccessFile(fileId: string, userId: string): Promise<boolean>;
    invalidateUserAccess(userId: string): Promise<void>;
    invalidateContentAccess(contentId: string): Promise<void>;
}
