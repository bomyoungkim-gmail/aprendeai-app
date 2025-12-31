"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicrosoftStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_microsoft_1 = require("passport-microsoft");
const config_1 = require("@nestjs/config");
const validate_oauth_use_case_1 = require("../../application/validate-oauth.use-case");
const urls_config_1 = require("../../../config/urls.config");
let MicrosoftStrategy = class MicrosoftStrategy extends (0, passport_1.PassportStrategy)(passport_microsoft_1.Strategy, "microsoft") {
    constructor(config, validateOAuthUseCase) {
        super({
            clientID: config.get("MICROSOFT_CLIENT_ID") || "dummy-client-id",
            clientSecret: config.get("MICROSOFT_CLIENT_SECRET") || "dummy-secret",
            callbackURL: urls_config_1.URL_CONFIG.oauth.microsoft,
            scope: ["user.read"],
            tenant: config.get("MICROSOFT_TENANT", "common"),
        });
        this.config = config;
        this.validateOAuthUseCase = validateOAuthUseCase;
    }
    async validate(accessToken, refreshToken, profile, done) {
        var _a;
        const { id, emails, displayName } = profile;
        try {
            const user = await this.validateOAuthUseCase.execute({
                oauthId: id,
                oauthProvider: "microsoft",
                email: emails && emails[0] ? emails[0].value : profile.mail,
                name: displayName || ((_a = profile.mail) === null || _a === void 0 ? void 0 : _a.split("@")[0]),
                picture: null,
            });
            done(null, user);
        }
        catch (error) {
            done(error, null);
        }
    }
};
exports.MicrosoftStrategy = MicrosoftStrategy;
exports.MicrosoftStrategy = MicrosoftStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        validate_oauth_use_case_1.ValidateOAuthUseCase])
], MicrosoftStrategy);
//# sourceMappingURL=microsoft.strategy.js.map