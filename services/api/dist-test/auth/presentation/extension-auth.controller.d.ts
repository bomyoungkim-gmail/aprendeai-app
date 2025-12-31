import { ExtensionAuthService } from "../extension-auth.service";
import { DeviceCodeStartDto, DeviceCodePollDto, DeviceCodeApproveDto, RefreshTokenDto } from "../dto/extension-auth.dto";
export declare class ExtensionAuthController {
    private readonly extensionAuth;
    constructor(extensionAuth: ExtensionAuthService);
    startDeviceCode(dto: DeviceCodeStartDto): Promise<{
        deviceCode: string;
        userCode: string;
        verificationUrl: string;
        expiresInSec: number;
        pollIntervalSec: number;
    }>;
    pollDeviceCode(dto: DeviceCodePollDto): Promise<{
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
    approveDeviceCode(user: any, dto: DeviceCodeApproveDto): Promise<{
        ok: boolean;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        expiresInSec: number;
        tokenType: string;
    }>;
    revokeGrant(user: any, grantId: string): Promise<{
        ok: boolean;
    }>;
    getMe(user: any): Promise<{
        userId: string;
        name: string;
        email: string;
    }>;
}
