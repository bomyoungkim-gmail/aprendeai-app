import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { URL_CONFIG } from '../../config/urls.config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('MICROSOFT_CLIENT_ID') || 'dummy-client-id',
      clientSecret: config.get('MICROSOFT_CLIENT_SECRET') || 'dummy-secret',
      callbackURL: URL_CONFIG.oauth.microsoft,
      scope: ['user.read'],
      tenant: config.get('MICROSOFT_TENANT', 'common'),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { id, emails, displayName } = profile;
    
    try {
      const user = await this.authService.validateOAuthUser({
        oauthId: id,
        oauthProvider: 'microsoft',
        email: emails && emails[0] ? emails[0].value : profile.mail,
        name: displayName || profile.mail?.split('@')[0],
        picture: null, // Microsoft doesn't provide picture in basic scope
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
