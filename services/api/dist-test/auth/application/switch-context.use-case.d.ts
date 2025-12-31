import { PrismaService } from "../../prisma/prisma.service";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";
export declare class SwitchContextUseCase {
    private readonly prisma;
    private readonly usersRepository;
    private readonly tokenGenerator;
    constructor(prisma: PrismaService, usersRepository: IUsersRepository, tokenGenerator: TokenGeneratorService);
    execute(userId: string, targetInstitutionId: string | null): Promise<import("../domain/auth.types").LoginResponse>;
}
