import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionService } from "../../billing/subscription.service";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";
export declare class ValidateOAuthUseCase {
    private readonly prisma;
    private readonly subscriptionService;
    private readonly usersRepository;
    private readonly tokenGenerator;
    constructor(prisma: PrismaService, subscriptionService: SubscriptionService, usersRepository: IUsersRepository, tokenGenerator: TokenGeneratorService);
    execute(oauthData: {
        oauthId: string;
        oauthProvider: string;
        email: string;
        name?: string;
        picture?: string;
    }): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        email: string;
        bio: string | null;
        address: string | null;
        sex: string | null;
        birthday: Date | null;
        age: number | null;
        password_hash: string | null;
        system_role: import(".prisma/client").$Enums.SystemRole | null;
        last_context_role: import(".prisma/client").$Enums.ContextRole;
        last_institution_id: string | null;
        oauth_provider: string | null;
        oauth_id: string | null;
        oauth_picture: string | null;
        schooling_level: string | null;
        preferred_languages: import("@prisma/client/runtime/library").JsonValue;
        last_login_at: Date | null;
        status: string;
        avatar_url: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        sso_provider: string | null;
        sso_subject: string | null;
        password_reset_token: string | null;
        password_reset_expires: Date | null;
    }>;
}
