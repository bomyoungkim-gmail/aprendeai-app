import { JwtService } from "@nestjs/jwt";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";
export declare class RefreshTokenUseCase {
    private readonly usersRepository;
    private readonly jwtService;
    private readonly tokenGenerator;
    constructor(usersRepository: IUsersRepository, jwtService: JwtService, tokenGenerator: TokenGeneratorService);
    execute(refreshToken: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            systemRole: import("../../users/domain/user.entity").UserSystemRole;
            contextRole: import("../../users/domain/user.entity").UserContextRole;
            institutionId: string;
        };
    }>;
}
