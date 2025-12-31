import { LoginDto, RegisterDto, ResetPasswordDto } from "../dto/auth.dto";
import { SwitchContextDto } from "../dto/switch-context.dto";
import { LoginUseCase } from "../application/login.use-case";
import { RegisterUseCase } from "../application/register.use-case";
import { RefreshTokenUseCase } from "../application/refresh-token.use-case";
import { SwitchContextUseCase } from "../application/switch-context.use-case";
import { ForgotPasswordUseCase } from "../application/forgot-password.use-case";
import { ResetPasswordUseCase } from "../application/reset-password.use-case";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";
export declare class AuthController {
    private readonly loginUseCase;
    private readonly registerUseCase;
    private readonly refreshTokenUseCase;
    private readonly switchContextUseCase;
    private readonly forgotPasswordUseCase;
    private readonly resetPasswordUseCase;
    private readonly tokenGenerator;
    private readonly logger;
    constructor(loginUseCase: LoginUseCase, registerUseCase: RegisterUseCase, refreshTokenUseCase: RefreshTokenUseCase, switchContextUseCase: SwitchContextUseCase, forgotPasswordUseCase: ForgotPasswordUseCase, resetPasswordUseCase: ResetPasswordUseCase, tokenGenerator: TokenGeneratorService);
    register(registerDto: RegisterDto, inviteToken?: string): Promise<{
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
    } | {
        status: string;
        approvalId: string;
    }>;
    login(loginDto: LoginDto): Promise<import("../domain/auth.types").LoginResponse>;
    refresh(body: {
        refresh_token: string;
    }): Promise<{
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
    getProfile(req: any): any;
    googleLogin(): void;
    googleCallback(req: any, res: any): Promise<void>;
    microsoftLogin(): void;
    microsoftCallback(req: any, res: any): Promise<void>;
    forgotPassword(dto: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    switchContext(req: any, body: SwitchContextDto): Promise<import("../domain/auth.types").LoginResponse>;
}
