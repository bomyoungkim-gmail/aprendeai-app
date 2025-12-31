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
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const config_1 = require("@nestjs/config");
const validate_oauth_use_case_1 = require("../../application/validate-oauth.use-case");
const urls_config_1 = require("../../../config/urls.config");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, "google") {
    constructor(config, validateOAuthUseCase) {
        super({
            clientID: config.get("GOOGLE_CLIENT_ID") || "dummy-client-id",
            clientSecret: config.get("GOOGLE_CLIENT_SECRET") || "dummy-secret",
            callbackURL: urls_config_1.URL_CONFIG.oauth.google,
            scope: ["email", "profile"],
        });
        this.config = config;
        this.validateOAuthUseCase = validateOAuthUseCase;
    }
    async validate(accessToken, refreshToken, profile, done) {
        const { id, emails, displayName, photos } = profile;
        try {
            const user = await this.validateOAuthUseCase.execute({
                oauthId: id,
                oauthProvider: "google",
                email: emails[0].value,
                name: displayName || emails[0].value.split("@")[0],
                picture: photos && photos[0] ? photos[0].value : null,
            });
            done(null, user);
        }
        catch (error) {
            done(error, null);
        }
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        validate_oauth_use_case_1.ValidateOAuthUseCase])
], GoogleStrategy);
//# sourceMappingURL=google.strategy.js.map