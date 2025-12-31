import { JwtService } from "@nestjs/jwt";
import { User } from "../../users/domain/user.entity";
import { LoginResponse } from "../domain/auth.types";
export declare class TokenGeneratorService {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    generateTokenSet(user: User): LoginResponse;
    generateAccessToken(user: User): string;
    private mapToDto;
}
