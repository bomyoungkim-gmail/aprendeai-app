import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { randomBytes, randomUUID } from "crypto";
import { EXTENSION_SCOPES } from "./dto/extension-auth.dto";
import { URL_CONFIG } from "../config/urls.config";
import { buildClaimsV2 } from "./domain/auth-claims.adapter";

@Injectable()
export class ExtensionAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService, // ✅ REUSE existing JWT service
  ) {}

  /**
   * Start device code flow
   * User will see userCode to authorize on website
   */
  async startDeviceCode(scopes: string[]) {
    // Validate scopes
    const validScopes = scopes.filter((s) =>
      EXTENSION_SCOPES.includes(s as any),
    );
    if (validScopes.length === 0) {
      validScopes.push("extension:webclip:create", "extension:session:start");
    }

    const deviceCode = "dev_" + randomBytes(32).toString("hex");
    const userCode = this.generateUserCode(); // ABCD-1234 format
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.extension_device_auth.create({
      data: {
        id: randomUUID(),
        device_code: deviceCode,
        user_code: userCode,
        requested_scopes: validScopes,
        expires_at: expiresAt,
        status: "PENDING",
        updated_at: new Date(),
      },
    });

    const frontendUrl = URL_CONFIG.frontend.verify;

    return {
      deviceCode,
      userCode,
      verificationUrl: frontendUrl,
      expiresInSec: 600,
      pollIntervalSec: 3,
    };
  }

  /**
   * Poll for device code status
   * Extension calls this repeatedly until user approves
   */
  async pollDeviceCode(deviceCode: string) {
    const auth = await this.prisma.extension_device_auth.findUnique({
      where: { device_code: deviceCode },
    });

    if (!auth) {
      return { status: "INVALID" };
    }

    // Check expiration
    if (auth.expires_at < new Date()) {
      await this.prisma.extension_device_auth.update({
        where: { id: auth.id },
        data: { status: "EXPIRED" },
      });
      return { status: "EXPIRED" };
    }

    // Still pending
    if (auth.status === "PENDING") {
      return { status: "PENDING", retryAfterSec: 3 };
    }

    // Denied
    if (auth.status === "DENIED") {
      return { status: "DENIED" };
    }

    // Approved - generate tokens
    if (auth.status === "APPROVED" && auth.user_id) {
      const tokens = await this.generateTokens(
        auth.user_id,
        auth.client_id,
        auth.requested_scopes as string[],
      );

      // Mark as consumed (prevent replay)
      await this.prisma.extension_device_auth.delete({
        where: { id: auth.id },
      });

      return {
        status: "APPROVED",
        tokenType: "Bearer",
        accessToken: tokens.accessToken,
        expiresInSec: 900, // 15 minutes
        refreshToken: tokens.refreshToken,
        scope: (auth.requested_scopes as string[]).join(" "),
      };
    }

    return { status: "PENDING", retryAfterSec: 3 };
  }

  /**
   * Approve device code (called by logged-in user via web UI)
   */
  async approveDeviceCode(userCode: string, userId: string, approve: boolean) {
    const auth = await this.prisma.extension_device_auth.findUnique({
      where: { user_code: userCode },
    });

    if (!auth) {
      throw new BadRequestException("Invalid user code");
    }

    if (auth.expires_at < new Date()) {
      throw new BadRequestException("Code expired");
    }

    if (auth.status !== "PENDING") {
      throw new BadRequestException("Code already processed");
    }

    await this.prisma.extension_device_auth.update({
      where: { id: auth.id },
      data: {
        status: approve ? "APPROVED" : "DENIED",
        user_id: approve ? userId : null,
      },
    });

    return { ok: true };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    const grant = await this.prisma.extension_grants.findUnique({
      where: { refresh_token: refreshToken },
    });

    if (!grant || grant.revoked_at) {
      throw new UnauthorizedException("Invalid or revoked refresh token");
    }

    // Update last used
    await this.prisma.extension_grants.update({
      where: { id: grant.id },
      data: { last_used_at: new Date() },
    });

    // Fetch user for claims
    const user = await this.prisma.users.findUnique({
      where: { id: grant.user_id },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Generate new access token (keep same refresh token)
    const claims = buildClaimsV2({
      id: user.id,
      email: user.email,
      systemRole: user.system_role,
      contextRole: user.last_context_role,
      institutionId: user.last_institution_id,
      scopes: grant.scopes as string[],
      clientId: grant.client_id,
    });

    const accessToken = this.jwtService.sign(claims, { expiresIn: "15m" });

    // Update grant with new token JTI
    const jti = this.extractJti(accessToken);
    await this.prisma.extension_grants.update({
      where: { id: grant.id },
      data: { access_token_jti: jti },
    });

    return {
      accessToken,
      expiresInSec: 900,
      tokenType: "Bearer",
    };
  }

  /**
   * Revoke extension grant
   */
  async revokeGrant(grantId: string, userId: string) {
    const grant = await this.prisma.extension_grants.findFirst({
      where: { id: grantId, user_id: userId },
    });

    if (!grant) {
      throw new BadRequestException("Grant not found");
    }

    await this.prisma.extension_grants.update({
      where: { id: grantId },
      data: { revoked_at: new Date() },
    });

    return { ok: true };
  }

  /**
   * Get user info for extension (masked email)
   */
  async getExtensionUserInfo(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      userId: user.id,
      name: user.name,
      email: user.email?.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask: ab***@domain.com
    };
  }

  /**
   * Generate tokens and save grant
   */
  private async generateTokens(
    userId: string,
    clientId: string,
    scopes: string[],
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const claims = buildClaimsV2({
      id: user.id,
      email: user.email,
      systemRole: user.system_role,
      contextRole: user.last_context_role,
      institutionId: user.last_institution_id,
      scopes,
      clientId,
    });

    const accessToken = this.jwtService.sign(claims, { expiresIn: "15m" });

    const refreshToken = "rft_" + randomBytes(32).toString("hex");
    const jti = this.extractJti(accessToken);

    // Save grant
    await this.prisma.extension_grants.create({
      data: {
        id: randomUUID(),
        user_id: userId,
        client_id: clientId,
        scopes,
        access_token_jti: jti,
        refresh_token: refreshToken,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate user-friendly code (ABCD-1234 format)
   */
  private generateUserCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Remove ambiguous chars
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += "-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Extract JTI from JWT (for revocation)
   */
  private extractJti(token: string): string {
    try {
      const decoded = this.jwtService.decode(token) as any;
      return decoded?.jti || token.substring(0, 16);
    } catch {
      return token.substring(0, 16);
    }
  }
}
