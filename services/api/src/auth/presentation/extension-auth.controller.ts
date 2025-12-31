import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ExtensionAuthService } from "../extension-auth.service";
import { JwtAuthGuard } from "../infrastructure/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import {
  DeviceCodeStartDto,
  DeviceCodePollDto,
  DeviceCodeApproveDto,
  RefreshTokenDto,
} from "../dto/extension-auth.dto";
import { Public } from "./decorators/public.decorator";

@ApiTags("Extension Auth")
@Controller("auth/extension") // Matches ROUTES.AUTH.EXTENSION_* pattern
export class ExtensionAuthController {
  constructor(private readonly extensionAuth: ExtensionAuthService) {}

  /**
   * Start device code flow (extension calls this)
   * No auth required - public endpoint
   */
  /**
   * Start device code flow (extension calls this)
   * No auth required - public endpoint
   */
  @Public()
  @Post("device/start")
  @ApiOperation({ summary: "Start device code flow for browser extension" })
  async startDeviceCode(@Body() dto: DeviceCodeStartDto) {
    return this.extensionAuth.startDeviceCode(dto.scopes);
  }

  /**
   * Poll device code status (extension calls this repeatedly)
   * No auth required - uses deviceCode as credential
   */
  /**
   * Poll device code status (extension calls this repeatedly)
   * No auth required - uses deviceCode as credential
   */
  @Public()
  @Post("device/poll")
  @ApiOperation({ summary: "Poll device code authorization status" })
  async pollDeviceCode(@Body() dto: DeviceCodePollDto) {
    return this.extensionAuth.pollDeviceCode(dto.deviceCode);
  }

  /**
   * Approve device code (web UI calls this)
   * Requires user to be logged in
   */
  @Post("device/approve")
  @UseGuards(JwtAuthGuard) // ✅ REUSE existing guard
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve or deny device code authorization" })
  async approveDeviceCode(
    @CurrentUser() user: any, // ✅ REUSE decorator
    @Body() dto: DeviceCodeApproveDto,
  ) {
    return this.extensionAuth.approveDeviceCode(
      dto.userCode,
      user.id,
      dto.approve,
    );
  }

  /**
   * Refresh access token
   * No JWT guard - uses refresh token as credential
   */
  /**
   * Refresh access token
   * No JWT guard - uses refresh token as credential
   */
  @Public()
  @Post("token/refresh")
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.extensionAuth.refreshToken(dto.refreshToken);
  }

  /**
   * Revoke extension grant
   * Requires user to be logged in
   */
  @Delete("grants/:grantId/revoke")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke extension authorization" })
  async revokeGrant(
    @CurrentUser() user: any,
    @Param("grantId") grantId: string,
  ) {
    return this.extensionAuth.revokeGrant(grantId, user.id);
  }

  /**
   * Get current extension user info (for UI display)
   * Requires extension token (JWT with scopes)
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current extension user information" })
  async getMe(@CurrentUser() user: any) {
    return this.extensionAuth.getExtensionUserInfo(user.id);
  }
}
