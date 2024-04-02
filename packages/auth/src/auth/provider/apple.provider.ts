import { Injectable } from '@nestjs/common';
import appleSignin from 'apple-signin-auth';

// export interface AppleAuthProfile {
//   iss: string; // 'https://appleid.apple.com',
//   aud: string; // 'ai.draftai.app.chatonce.development',
//   exp: number; // 1695394721,
//   iat: number; // 1695308321,
//   sub: string; // '001106.c9ddb1eb26ee4c34a57149bf8312d436.1024',
//   c_hash: string; // '-1bg1Wr-oN8IFqXMDCJhKg',
//   email: string; // 'yhostc@gmail.com',
//   email_verified: string; // 'true',
//   auth_time: number; // 1695308321,
//   nonce_supported: boolean; // true
//   is_private_email?: string; //  "true"
//   real_user_status?: number; // 0(或Unsupported)、1 (或Unknown)、2 (或)
// }

@Injectable()
export class AppleProviderService {
  // constructor(
  //   @Inject('CONFIG')
  //   private readonly config: types.Options,
  // ) {
  //   // if (!this.config?.apple) {
  //   //   console.warn(`[auth]no config, skip apple provider.`);
  //   //   return;
  //   // }
  // }

  /**
   * 验证 Apple identityToken
   * https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/authenticating_users_with_sign_in_with_apple#3383773
   */
  async validateAppleIdToken(idToken: string) {
    const payload = await appleSignin.verifyIdToken(idToken, {
      // audience: 'ai.draftai.app.chatonce.development', // client id - can also be an array
    });
    return payload;
  }
}
