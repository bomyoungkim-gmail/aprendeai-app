import { IsString, IsArray, IsBoolean } from "class-validator";

/**
 * Extension scopes (restricted capabilities)
 */
export const EXTENSION_SCOPES = [
  "extension:webclip:create",
  "extension:session:start",
  "extension:prompt:send",
] as const;

export type ExtensionScope = (typeof EXTENSION_SCOPES)[number];

/**
 * DTO for starting device code flow
 */
export class DeviceCodeStartDto {
  @IsString()
  clientId: string = "browser-extension";

  @IsArray()
  @IsString({ each: true })
  scopes: string[] = ["extension:webclip:create", "extension:session:start"];
}

/**
 * DTO for polling device code status
 */
export class DeviceCodePollDto {
  @IsString()
  clientId: string;

  @IsString()
  deviceCode: string;
}

/**
 * DTO for approving device code (web UI)
 */
export class DeviceCodeApproveDto {
  @IsString()
  userCode: string;

  @IsBoolean()
  approve: boolean;
}

/**
 * DTO for refreshing access token
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
