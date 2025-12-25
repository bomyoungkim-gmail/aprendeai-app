import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { ExtensionAuthService } from "./extension-auth.service";
import { ExtensionAuthController } from "./extension-auth.controller";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { MicrosoftStrategy } from "./strategies/microsoft.strategy";
import { EmailModule } from "../email/email.module";
import { InstitutionsModule } from "../institutions/institutions.module";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    EmailModule,
    InstitutionsModule,
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
          signOptions: { expiresIn: "60m" },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    MicrosoftStrategy,
    ExtensionAuthService,
  ],
  controllers: [AuthController, ExtensionAuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
