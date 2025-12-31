import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../email/email.service";
export declare class ForgotPasswordUseCase {
    private readonly usersRepository;
    private readonly prisma;
    private readonly emailService;
    constructor(usersRepository: IUsersRepository, prisma: PrismaService, emailService: EmailService);
    execute(email: string): Promise<boolean>;
}
