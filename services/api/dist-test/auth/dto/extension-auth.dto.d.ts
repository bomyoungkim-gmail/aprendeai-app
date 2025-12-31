export declare const EXTENSION_SCOPES: readonly ["extension:webclip:create", "extension:session:start", "extension:prompt:send"];
export type ExtensionScope = (typeof EXTENSION_SCOPES)[number];
export declare class DeviceCodeStartDto {
    clientId: string;
    scopes: string[];
}
export declare class DeviceCodePollDto {
    clientId: string;
    deviceCode: string;
}
export declare class DeviceCodeApproveDto {
    userCode: string;
    approve: boolean;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
