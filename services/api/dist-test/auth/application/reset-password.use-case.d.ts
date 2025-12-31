import { PrismaService } from "../../prisma/prisma.service";
import { ResetPasswordDto } from "../dto/auth.dto";
export declare class ResetPasswordUseCase {
    private readonly prisma;
    constructor(prisma: PrismaService);
    execute(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
