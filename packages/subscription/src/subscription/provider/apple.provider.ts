import { AppStoreServerAPIClient, ResponseBodyV2DecodedPayload } from '@apple/app-store-server-library';
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';
import { Inject, Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

import type { subscription } from '../types';

@Injectable()
export class AppleProviderService {
  private appleRootCAs: Buffer[];
  private verifier: SignedDataVerifier;
  private readonly client: AppStoreServerAPIClient;

  constructor(
    @Inject('CONFIG')
    private readonly config: subscription.Options,
  ) {
    if (!this.config.apple) {
      console.warn(`[subscription]apple, no config, skip stripe provider.`);
      return;
    }

    const { signingKey, keyId, issuerId, bundleId, environment: env } = this.config.apple;
    const environment = env === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX;
    this.client = new AppStoreServerAPIClient(signingKey, keyId, issuerId, bundleId, environment);

    this.readAppleCerts().then((appleRootCAs) => {
      this.verifier = new SignedDataVerifier(appleRootCAs, true, environment, bundleId);
    });

    setTimeout(() => this.requestTestNotification(), 10000);
  }

  private async readAppleCerts(): Promise<Buffer[]> {
    // mkdir .certs
    !fs.existsSync('./.certs') && fs.mkdirSync('./.certs');

    const urls = [
      'https://www.apple.com/appleca/AppleIncRootCertificate.cer',
      'https://www.apple.com/certificateauthority/AppleComputerRootCertificate.cer',
      'https://www.apple.com/certificateauthority/AppleRootCA-G2.cer',
      'https://www.apple.com/certificateauthority/AppleRootCA-G3.cer',
    ];
    return await Promise.all(urls.map((url) => this.downloadAppleCert(url)));
  }

  private async downloadAppleCert(url: string): Promise<Buffer> {
    const localFilePath = path.join('./.certs/', path.basename(url));
    const localCertExists = fs.existsSync(localFilePath);
    if (localCertExists) {
      return fs.readFileSync(localFilePath);
    } else {
      const buffer = Buffer.from(await fetch(url).then((res) => res.arrayBuffer()));
      fs.writeFileSync(localFilePath, buffer);
      return buffer;
    }
  }

  /**
   * 申请测试通知，以验证接口是否正常
   */
  public async requestTestNotification() {
    return this.client.requestTestNotification();
  }

  public async validateWebhookSignature({ signedPayload }) {
    const notice: ResponseBodyV2DecodedPayload = await this.verifier.verifyAndDecodeNotification(signedPayload);
    console.log(`[subscription]apple`, notice);
    // 筛选需要的事件，转化为统一返回格式。
    // // const  signedTransactionInfo, signedRenewalInfo } = notice.data;
    return notice;
  }
}
