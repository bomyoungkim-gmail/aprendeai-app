import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>("JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("JWT_SECRET must be configured in environment variables");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    // Fetch full user from database to include settings (primaryFamilyId)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        systemRole: true,
        contextRole: true,
        activeInstitutionId: true,
        settings: true,
      },
    });

    if (!user) {
      return null; // This causes 401
    }

    // Build user object for request
    // If payload has new fields (systemRole, contextRole), use them
    // Otherwise fall back to legacy role field
    const userWithRoles = {
      ...user,
      // Preserve JWT payload fields (in case they differ from DB)
      ...(payload.systemRole && { systemRole: payload.systemRole }),
      ...(payload.contextRole && { contextRole: payload.contextRole }),
      ...(payload.activeInstitutionId && { 
        activeInstitutionId: payload.activeInstitutionId 
      }),
      // Legacy role field (for backward compatibility)
      ...(payload.role && { role: payload.role }),
      // Extension-specific fields
      ...(payload.scopes && { scopes: payload.scopes }),
      ...(payload.clientId && { clientId: payload.clientId }),
    };

    return userWithRoles;
  }
}
