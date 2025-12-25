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
        settings: true,
      },
    });

    if (!user) {
      return null; // This causes 401
    }

    // ✅ FIX: Include scopes from JWT payload for ExtensionScopeGuard
    // Extension tokens have { sub, scopes, clientId }, web app tokens don't
    const userWithScopes = {
      ...user,
      ...(payload.scopes && { scopes: payload.scopes }),
      ...(payload.clientId && { clientId: payload.clientId }),
    };

    return userWithScopes;
  }
}
