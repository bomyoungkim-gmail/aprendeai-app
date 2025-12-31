import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-microsoft";
import { ConfigService } from "@nestjs/config";
import { ValidateOAuthUseCase } from "../../application/validate-oauth.use-case";
import { URL_CONFIG } from "../../../config/urls.config";

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, "microsoft") {
  constructor(
    private config: ConfigService,
    private validateOAuthUseCase: ValidateOAuthUseCase,
  ) {
    super({
      clientID: config.get("MICROSOFT_CLIENT_ID") || "dummy-client-id",
      clientSecret: config.get("MICROSOFT_CLIENT_SECRET") || "dummy-secret",
      callbackURL: URL_CONFIG.oauth.microsoft,
      scope: ["user.read"],
      tenant: config.get("MICROSOFT_TENANT", "common"),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const { id, emails, displayName } = profile;

    try {
      const user = await this.validateOAuthUseCase.execute({
        oauthId: id,
        oauthProvider: "microsoft",
        email: emails && emails[0] ? emails[0].value : profile.mail,
        name: displayName || profile.mail?.split("@")[0],
        picture: null, // Microsoft doesn't provide picture in basic scope
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
