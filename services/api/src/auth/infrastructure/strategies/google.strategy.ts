import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { ValidateOAuthUseCase } from "../../application/validate-oauth.use-case";
import { URL_CONFIG } from "../../../config/urls.config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private config: ConfigService,
    private validateOAuthUseCase: ValidateOAuthUseCase,
  ) {
    super({
      clientID: config.get("GOOGLE_CLIENT_ID") || "dummy-client-id",
      clientSecret: config.get("GOOGLE_CLIENT_SECRET") || "dummy-secret",
      callbackURL: URL_CONFIG.oauth.google,
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
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
    } catch (error) {
      done(error, null);
    }
  }
}
