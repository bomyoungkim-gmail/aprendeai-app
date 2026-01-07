import { Module } from "@nestjs/common";
import { AuthController } from "./presentation/auth.controller";
import { ExtensionAuthService } from "./extension-auth.service";
import { ExtensionAuthController } from "./presentation/extension-auth.controller";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./infrastructure/jwt.strategy";
import { GoogleStrategy } from "./infrastructure/strategies/google.strategy";
import { MicrosoftStrategy } from "./infrastructure/strategies/microsoft.strategy";
import { ApiKeyGuard } from "./infrastructure/api-key.guard";
import { EmailModule } from "../email/email.module";
import { InstitutionsModule } from "../institutions/institutions.module";
import { FeatureFlagsModule } from "../common/feature-flags.module";
import { PermissionEvaluator } from "./domain/permission.evaluator";

// Use Cases
import { LoginUseCase } from "./application/login.use-case";
import { RegisterUseCase } from "./application/register.use-case";
import { RefreshTokenUseCase } from "./application/refresh-token.use-case";
import { SwitchContextUseCase } from "./application/switch-context.use-case";
import { ValidateOAuthUseCase } from "./application/validate-oauth.use-case";
import { ForgotPasswordUseCase } from "./application/forgot-password.use-case";
import { ResetPasswordUseCase } from "./application/reset-password.use-case";

// Infrastructure
import { TokenGeneratorService } from "./infrastructure/token-generator.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    EmailModule,
    InstitutionsModule,
    FeatureFlagsModule,
    BillingModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        if (!secret) {
          throw new Error(
            "JWT_SECRET must be configured in environment variables",
          );
        }
        return {
          secret,
          signOptions: { expiresIn: "15m" }, // Access token 15 min
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    JwtStrategy,
    GoogleStrategy,
    MicrosoftStrategy,
    ApiKeyGuard,
    ExtensionAuthService,
    PermissionEvaluator,
    TokenGeneratorService,
    // Use Cases
    LoginUseCase,
    RegisterUseCase,
    RefreshTokenUseCase,
    SwitchContextUseCase,
    ValidateOAuthUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
  controllers: [AuthController, ExtensionAuthController],
  exports: [JwtModule, PermissionEvaluator, TokenGeneratorService, ApiKeyGuard],
})
export class AuthModule {}
