import {
  AppStoreServerAPIClient,
  Environment,
  ResponseBodyV2DecodedPayload,
  SignedDataVerifier,
} from '@apple/app-store-server-library';
import { SendTestNotificationResponse } from '@apple/app-store-server-library';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

import type { SubscriptionModuleOptions } from '@/subscription/interface';

// import { NotificationType } from './constant';
// import { ProviderNotificationDto, ProviderSubscription } from './dto/decode-transaction.dto';
// import { AppleAuthProfile } from './interface/apple.interface';

@Injectable()
export class AppleProviderService implements OnModuleInit {
  private appleRootCAs: Buffer[];
  private verifier: SignedDataVerifier;
  private readonly client: AppStoreServerAPIClient;

  constructor(
    @Inject('PAYMENT_CONFIG')
    private readonly config: SubscriptionModuleOptions,
  ) {
    if (!this.config.apple) {
      console.warn(`[subscription]apple, no config, skip stripe provider.`);
      return;
    }

    const { signingKey, keyId, issuerId, bundleId, environment: env } = this.config.apple;
    const environment = env === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX;
    this.client = new AppStoreServerAPIClient(signingKey, keyId, issuerId, bundleId, environment);
  }

  async onModuleInit() {
    if (!this.config.apple) {
      return;
    }

    this.appleRootCAs = await this.readAppleCerts();
    const { environment: env, bundleId } = this.config.apple;
    const environment = env === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX;
    this.verifier = new SignedDataVerifier(this.appleRootCAs, true, environment, bundleId);
  }

  private async readAppleCerts(): Promise<Buffer[]> {
    try {
      const urls = [
        'https://www.apple.com/appleca/AppleIncRootCertificate.cer',
        'https://www.apple.com/certificateauthority/AppleComputerRootCertificate.cer',
        'https://www.apple.com/certificateauthority/AppleRootCA-G2.cer',
        'https://www.apple.com/certificateauthority/AppleRootCA-G3.cer',
      ];
      return await Promise.all(urls.map((url) => this.downloadAppleCert(url)));
    } catch (error) {
      console.error(`[subscription]apple, Error in downloading Apple certificates:`, error);
      throw error;
    }
  }

  private async downloadAppleCert(url: string): Promise<Buffer> {
    try {
      // certs 不存在则创建目录
      if (!fs.existsSync('./.certs')) {
        fs.mkdirSync('./.certs');
      }
      const localFilePath = path.join('./.certs/', path.basename(url));
      const localCertExists = fs.existsSync(localFilePath);
      if (localCertExists) {
        return fs.readFileSync(localFilePath);
      } else {
        const buffer = Buffer.from(await fetch(url).then((res) => res.arrayBuffer()));
        fs.writeFileSync(localFilePath, buffer);
        return buffer;
      }
    } catch (error) {
      console.error(`[subscription]apple, Error downloading ${url}:`, error);
      throw error;
    }
  }

  /**
   * 申请测试通知，以验证接口是否正常
   */
  async requestNotification(): Promise<SendTestNotificationResponse> {
    return await this.client.requestTestNotification();
  }

  async validateWebhookSignature(body: any) {
    const notice: ResponseBodyV2DecodedPayload = await this.verifier.verifyAndDecodeNotification(body);
    const { signedTransactionInfo, signedRenewalInfo } = notice.data;
    return notice;
  }
}
