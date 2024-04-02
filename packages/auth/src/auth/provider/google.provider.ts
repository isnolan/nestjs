import { Inject, Injectable } from '@nestjs/common';
import { Auth, google } from 'googleapis';

export type GoogleAuthorization = { url: string } | { tokens: Auth.Credentials };

export interface GoogleAuthProfile {
  iss: string; // 'https://accounts.google.com';
  azp: string; // '747895093829-s3s7ljd1995if2k5tu6leb6uqfh713j1.apps.googleusercontent.com';
  aud: string; // '747895093829-s3s7ljd1995if2k5tu6leb6uqfh713j1.apps.googleusercontent.com';
  sub: string; // '111545197740562615945';
  email: string; // 'yhostc@gmail.com';
  email_verified: boolean; // true;
  at_hash: string; // 'VLwoBlcafHnVvDIFIgm3Qg';
  nonce: string; // 'caez5zxRZf8VWvnSKxP-Il0ghpmi_KwaQu6wWJcPn0I';
  name: string; // 'Nan Zhang';
  picture: string; // 'https://lh3.googleusercontent.com/a/ACg8ocLhvqkHxCcdxoYOwyj_WbrqX7Rn9pR4jL8Vzrgviaph=s96-c';
  given_name: string; // 'Nan';
  family_name: string; // 'Zhang';
  locale: string; // 'en';
  iat: number; //  1695298843;
  exp: number; // 1695302443;
}

@Injectable()
export class GoogleProviderService {
  private readonly packageName: string;
  private readonly publisher = google.androidpublisher({ version: 'v3' });

  constructor(@Inject('CONFIG') private readonly config) {
    // if (!this.config.google) {
    //   console.warn(`[auth]no config, skip google provider.`);
    //   return;
    // }
  }
  /**
   * 验证Google
   * https://developers.google.com/identity/openid-connect/openid-connect?hl=zh-cn#obtainuserinfo
  [providers]notify: GooglePlay {
    message: {
      data: 'eyJ2ZXJzaW9uIjoiMS4wIiwicGFja2FnZU5hbWUiOiJhaS5kcmFmdGFpLmFwcC5jaGF0b25jZSIsImV2ZW50VGltZU1pbGxpcyI6IjE3MDA1NDgwOTI4NDYiLCJzdWJzY3JpcHRpb25Ob3RpZmljYXRpb24iOnsidmVyc2lvbiI6IjEuMCIsIm5vdGlmaWNhdGlvblR5cGUiOjEzLCJwdXJjaGFzZVRva2VuIjoiam9mYWVqYWtma2xwYWlvYWRoaWhhbW1rLkFPLUoxT3djYlFFMUk2dUtTWFFXNmdxWUs2VzRzV3dONUxrUnFNV0tYQnhZWk05eWRTZVdibDNrLVk1YW0xbkJ1SHNsMDJ0ZXJ3V0dLR0NKSUcxaGtCMWVBUHBzdUZiUlp0Z3ZJalBaZWxZbnhTdU1hdE9PUlZ3Iiwic3Vic2NyaXB0aW9uSWQiOiJza3UucHJlbWl1bS5tb250aGx5In19',
      messageId: '9673941762953385',
      message_id: '9673941762953385',
      publishTime: '2023-11-21T06:28:13.107Z',
      publish_time: '2023-11-21T06:28:13.107Z'
    },
    subscription: 'projects/darftai/subscriptions/chatonce-service'
  } 
  */
  async validateGoogleIdToken(idToken: string): Promise<GoogleAuthProfile> {
    if (!this.config.google) {
      console.warn(`[auth]no config, skip google provider.`);
      return;
    }

    // 初始化 Google OAuth 客户端
    const GOOGLE_CLIENT_ID = this.config.google.clientId;
    const googleClient = new google.auth.OAuth2(GOOGLE_CLIENT_ID); // 从配置或环境变量获取
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    return ticket.getPayload() as GoogleAuthProfile;
  }
}
