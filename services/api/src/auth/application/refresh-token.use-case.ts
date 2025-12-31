import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { AuthClaims } from "../domain/auth.types";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(IUsersRepository)
    private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
    private readonly tokenGenerator: TokenGeneratorService,
  ) {}

  async execute(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken) as AuthClaims;

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid token type");
      }

      const user = await this.usersRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const access_token = this.tokenGenerator.generateAccessToken(user);

      return {
        access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          systemRole: user.systemRole,
          contextRole: user.contextRole,
          institutionId: user.institutionId,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
