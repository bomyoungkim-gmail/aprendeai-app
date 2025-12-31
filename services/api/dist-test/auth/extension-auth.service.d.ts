import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
export declare class ExtensionAuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    startDeviceCode(scopes: string[]): Promise<{
        deviceCode: string;
        userCode: string;
        verificationUrl: string;
        expiresInSec: number;
        pollIntervalSec: number;
    }>;
    pollDeviceCode(deviceCode: string): Promise<{
        status: string;
        retryAfterSec?: undefined;
        tokenType?: undefined;
        accessToken?: undefined;
        expiresInSec?: undefined;
        refreshToken?: undefined;
        scope?: undefined;
    } | {
        status: string;
        retryAfterSec: number;
        tokenType?: undefined;
        accessToken?: undefined;
        expiresInSec?: undefined;
        refreshToken?: undefined;
        scope?: undefined;
    } | {
        status: string;
        tokenType: string;
        accessToken: string;
        expiresInSec: number;
        refreshToken: string;
        scope: string;
        retryAfterSec?: undefined;
    }>;
    approveDeviceCode(userCode: string, userId: string, approve: boolean): Promise<{
        ok: boolean;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresInSec: number;
        tokenType: string;
    }>;
    revokeGrant(grantId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    getExtensionUserInfo(userId: string): Promise<{
        userId: string;
        name: string;
        email: string;
    }>;
    private generateTokens;
    private generateUserCode;
    private extractJti;
}
