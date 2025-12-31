"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_controller_1 = require("./presentation/auth.controller");
const extension_auth_service_1 = require("./extension-auth.service");
const extension_auth_controller_1 = require("./presentation/extension-auth.controller");
const users_module_1 = require("../users/users.module");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const jwt_strategy_1 = require("./infrastructure/jwt.strategy");
const google_strategy_1 = require("./infrastructure/strategies/google.strategy");
const microsoft_strategy_1 = require("./infrastructure/strategies/microsoft.strategy");
const email_module_1 = require("../email/email.module");
const institutions_module_1 = require("../institutions/institutions.module");
const feature_flags_module_1 = require("../common/feature-flags.module");
const permission_evaluator_1 = require("./domain/permission.evaluator");
const login_use_case_1 = require("./application/login.use-case");
const register_use_case_1 = require("./application/register.use-case");
const refresh_token_use_case_1 = require("./application/refresh-token.use-case");
const switch_context_use_case_1 = require("./application/switch-context.use-case");
const validate_oauth_use_case_1 = require("./application/validate-oauth.use-case");
const forgot_password_use_case_1 = require("./application/forgot-password.use-case");
const reset_password_use_case_1 = require("./application/reset-password.use-case");
const token_generator_service_1 = require("./infrastructure/token-generator.service");
const billing_module_1 = require("../billing/billing.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            passport_1.PassportModule,
            email_module_1.EmailModule,
            institutions_module_1.InstitutionsModule,
            feature_flags_module_1.FeatureFlagsModule,
            billing_module_1.BillingModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const secret = configService.get("JWT_SECRET");
                    if (!secret) {
                        throw new Error("JWT_SECRET must be configured in environment variables");
                    }
                    return {
                        secret,
                        signOptions: { expiresIn: "15m" },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            jwt_strategy_1.JwtStrategy,
            google_strategy_1.GoogleStrategy,
            microsoft_strategy_1.MicrosoftStrategy,
            extension_auth_service_1.ExtensionAuthService,
            permission_evaluator_1.PermissionEvaluator,
            token_generator_service_1.TokenGeneratorService,
            login_use_case_1.LoginUseCase,
            register_use_case_1.RegisterUseCase,
            refresh_token_use_case_1.RefreshTokenUseCase,
            switch_context_use_case_1.SwitchContextUseCase,
            validate_oauth_use_case_1.ValidateOAuthUseCase,
            forgot_password_use_case_1.ForgotPasswordUseCase,
            reset_password_use_case_1.ResetPasswordUseCase,
        ],
        controllers: [auth_controller_1.AuthController, extension_auth_controller_1.ExtensionAuthController],
        exports: [jwt_1.JwtModule, permission_evaluator_1.PermissionEvaluator, token_generator_service_1.TokenGeneratorService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map