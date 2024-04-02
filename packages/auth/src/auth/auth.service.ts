import { Injectable } from '@nestjs/common';

import { AppleProviderService, GoogleProviderService } from './provider';
import { SocialDto } from './types';

@Injectable()
export class AuthService {
  constructor(private readonly google: GoogleProviderService, private readonly apple: AppleProviderService) {}

  /**
   * 授权登录，获取用户Profile
   * @param idToken
   * @returns
   */
  async validateIdToken(provider: 'apple' | 'google', idToken: string): Promise<SocialDto> {
    if (provider === 'apple') {
      const res = await this.apple.validateAppleIdToken(idToken);
      const emailVerified = res.email_verified == 'true';
      return { appId: res.aud, openId: res.sub, email: res.email, emailVerified };
    }

    if (provider === 'google') {
      const res = await this.google.validateGoogleIdToken(idToken);
      const gid = res.aud.match(/(\d+)-([a-zA-Z0-9]+)/);
      return {
        unionId: gid[1],
        appId: gid[2],
        openId: res.sub,
        email: res.email,
        emailVerified: res.email_verified,
        nickname: res.name,
        avatar: res.picture,
        locale: res.locale,
      };
    }
  }
}
