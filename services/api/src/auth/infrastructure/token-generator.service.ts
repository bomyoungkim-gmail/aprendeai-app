import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "../../users/domain/user.entity";
import { buildClaimsV2 } from "../domain/auth-claims.adapter";
import { LoginResponse } from "../domain/auth.types";

@Injectable()
export class TokenGeneratorService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generates a full set of tokens (access + refresh) for a user.
   */
  generateTokenSet(user: User): LoginResponse {
    const claims = buildClaimsV2({
      id: user.id,
      email: user.email,
      systemRole: user.systemRole,
      contextRole: user.contextRole,
      institutionId: user.institutionId,
    });

    const access_token = this.jwtService.sign(claims, { expiresIn: "15m" });
    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: "refresh" },
      { expiresIn: "7d" },
    );

    return {
      access_token,
      refresh_token,
      user: this.mapToDto(user),
    };
  }

  /**
   * Generates only an access token (useful for refresh flows).
   */
  generateAccessToken(user: User): string {
    const claims = buildClaimsV2({
      id: user.id,
      email: user.email,
      systemRole: user.systemRole,
      contextRole: user.contextRole,
      institutionId: user.institutionId,
    });

    return this.jwtService.sign(claims, { expiresIn: "15m" });
  }

  private mapToDto(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      systemRole: user.systemRole,
      contextRole: user.contextRole,
      institutionId: user.institutionId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
