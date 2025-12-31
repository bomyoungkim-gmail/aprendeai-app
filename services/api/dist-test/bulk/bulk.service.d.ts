import { PrismaService } from "../prisma/prisma.service";
export declare class BulkService {
    private prisma;
    constructor(prisma: PrismaService);
    bulkInviteFromCSV(institutionId: string, csvBuffer: Buffer): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }>;
    bulkApprovePending(institutionId: string, userIds: string[], action: "approve" | "reject"): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }>;
    exportMembersCSV(institutionId: string): Promise<string>;
}
