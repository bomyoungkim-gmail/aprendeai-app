import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { randomBytes } from "crypto";
import { EXTENSION_SCOPES } from "./dto/extension-auth.dto";
import { URL_CONFIG } from "../config/urls.config";

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

    await this.prisma.extensionDeviceAuth.create({
      data: {
        deviceCode,
        userCode,
        requestedScopes: validScopes,
        expiresAt,
        status: "PENDING",
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
    const auth = await this.prisma.extensionDeviceAuth.findUnique({
      where: { deviceCode },
    });

    if (!auth) {
      return { status: "INVALID" };
    }

    // Check expiration
    if (auth.expiresAt < new Date()) {
      await this.prisma.extensionDeviceAuth.update({
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
    if (auth.status === "APPROVED" && auth.userId) {
      const tokens = await this.generateTokens(
        auth.userId,
        auth.clientId,
        auth.requestedScopes as string[],
      );

      // Mark as consumed (prevent replay)
      await this.prisma.extensionDeviceAuth.delete({
        where: { id: auth.id },
      });

      return {
        status: "APPROVED",
        tokenType: "Bearer",
        accessToken: tokens.accessToken,
        expiresInSec: 900, // 15 minutes
        refreshToken: tokens.refreshToken,
        scope: (auth.requestedScopes as string[]).join(" "),
      };
    }

    return { status: "PENDING", retryAfterSec: 3 };
  }

  /**
   * Approve device code (called by logged-in user via web UI)
   */
  async approveDeviceCode(userCode: string, userId: string, approve: boolean) {
    const auth = await this.prisma.extensionDeviceAuth.findUnique({
      where: { userCode },
    });

    if (!auth) {
      throw new BadRequestException("Invalid user code");
    }

    if (auth.expiresAt < new Date()) {
      throw new BadRequestException("Code expired");
    }

    if (auth.status !== "PENDING") {
      throw new BadRequestException("Code already processed");
    }

    await this.prisma.extensionDeviceAuth.update({
      where: { id: auth.id },
      data: {
        status: approve ? "APPROVED" : "DENIED",
        userId: approve ? userId : null,
      },
    });

    return { ok: true };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    const grant = await this.prisma.extensionGrant.findUnique({
      where: { refreshToken },
    });

    if (!grant || grant.revokedAt) {
      throw new UnauthorizedException("Invalid or revoked refresh token");
    }

    // Update last used
    await this.prisma.extensionGrant.update({
      where: { id: grant.id },
      data: { lastUsedAt: new Date() },
    });

    // Generate new access token (keep same refresh token)
    const accessToken = this.jwtService.sign(
      {
        sub: grant.userId,
        scopes: grant.scopes,
        clientId: grant.clientId,
      },
      { expiresIn: "15m" },
    );

    // Update grant with new token JTI
    const jti = this.extractJti(accessToken);
    await this.prisma.extensionGrant.update({
      where: { id: grant.id },
      data: { accessTokenJti: jti },
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
    const grant = await this.prisma.extensionGrant.findFirst({
      where: { id: grantId, userId },
    });

    if (!grant) {
      throw new BadRequestException("Grant not found");
    }

    await this.prisma.extensionGrant.update({
      where: { id: grantId },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }

  /**
   * Get user info for extension (masked email)
   */
  async getExtensionUserInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
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
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        scopes,
        clientId,
      },
      { expiresIn: "15m" },
    );

    const refreshToken = "rft_" + randomBytes(32).toString("hex");
    const jti = this.extractJti(accessToken);

    // Save grant
    await this.prisma.extensionGrant.create({
      data: {
        userId,
        clientId,
        scopes,
        accessTokenJti: jti,
        refreshToken,
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
