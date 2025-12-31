import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

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
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        // role: true, // Legacy removed
        system_role: true,
        last_context_role: true,
        last_institution_id: true,
        settings: true,
      },
    });

    if (!user) {
      return null; // This causes 401
    }

    // Build user object for request
    // If payload has new fields (systemRole, contextRole), use them
    // Otherwise fall back to legacy role field or DB
    // Note: DB returns snake_case for some fields based on schema mapping history
    const userWithRoles = {
      id: user.id,
      email: user.email,
      name: user.name,
      // role: user.role, // Legacy removed
      settings: user.settings,

      // V2 Roles - Prioritize payload (from switchContext/login) > DB
      systemRole: payload.systemRole ?? user.system_role,

      // Context Role - Critical for RoleGuard
      contextRole: payload.contextRole ?? user.last_context_role,

      // Active Institution - Critical for InstitutionGuard
      institutionId: payload.institutionId ?? user.last_institution_id,

      // Preserve JWT payload fields (in case they differ from DB during session)
      ...(payload.systemRole && { systemRole: payload.systemRole }),
      ...(payload.contextRole && { contextRole: payload.contextRole }),
      ...(payload.institutionId && {
        institutionId: payload.institutionId,
      }),
      // Legacy role field (for backward compatibility)
      // ...(payload.role && { role: payload.role }), // Legacy removed
      // Extension-specific fields
      ...(payload.scopes && { scopes: payload.scopes }),
      ...(payload.clientId && { clientId: payload.clientId }),
    };

    return userWithRoles;
  }
}
