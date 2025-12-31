import { PrismaService } from "../prisma/prisma.service";
import { AssetLayer } from "@prisma/client";
export declare class GatingService {
    private prisma;
    constructor(prisma: PrismaService);
    determineLayer(userId: string, contentId: string, requestedLayer?: AssetLayer): Promise<AssetLayer>;
    updateEligibility(userId: string): Promise<void>;
    checkL2Eligibility(userId: string): Promise<boolean>;
    checkL3Eligibility(userId: string): Promise<boolean>;
    private getOrCreateEligibility;
    getEligibility(userId: string): Promise<{
        updated_at: Date;
        user_id: string;
        eligible_l2: boolean;
        eligible_l3: boolean;
        reason_json: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
