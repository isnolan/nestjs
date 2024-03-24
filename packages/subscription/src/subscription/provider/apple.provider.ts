import {
  AppStoreServerAPIClient,
  Environment,
  ResponseBodyV2DecodedPayload,
  SignedDataVerifier,
} from '@apple/app-store-server-library';
import { SendTestNotificationResponse } from '@apple/app-store-server-library';
import { Injectable, OnModuleInit } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

// import { NotificationType } from './constant';
// import { ProviderNotificationDto, ProviderSubscription } from './dto/decode-transaction.dto';
// import { AppleAuthProfile } from './interface/apple.interface';

@Injectable()
export class ProviderAppleService implements OnModuleInit {
  private appleRootCAs: Buffer[];
  private readonly client: AppStoreServerAPIClient;
  private verifier: SignedDataVerifier;
  private readonly environment: Environment =
    process.env?.NODE_ENV === 'production' ? Environment.PRODUCTION : Environment.SANDBOX;
  private readonly bundleId = 'ai.draftai.app.chatonce';
  async onModuleInit() {
    this.appleRootCAs = await this.readAppleCerts();
    this.verifier = new SignedDataVerifier(this.appleRootCAs, true, this.environment, this.bundleId);
  }

  constructor() {
    const issuerId = '4746a47f-9d61-46cd-96b3-7f437c94cb85';
    const keyId = 'PCK6JNB43N';
    const encodedKey = fs.readFileSync('./certs/apple_subscript_PCK6JNB43N.p8').toString(); // readFile(filePath); // Specific implementation may vary
    this.client = new AppStoreServerAPIClient(encodedKey, keyId, issuerId, this.bundleId, this.environment);
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
      console.error(`[apple]Error in downloading Apple certificates:`, error);
      throw error;
    }
  }

  private async downloadAppleCert(url: string): Promise<Buffer> {
    try {
      const localFilePath = path.join('./certs/', path.basename(url));
      const localCertExists = fs.existsSync(localFilePath);
      if (localCertExists) {
        return fs.readFileSync(localFilePath);
      } else {
        const buffer = Buffer.from(await fetch(url).then((res) => res.arrayBuffer()));
        fs.writeFileSync(localFilePath, buffer);
        return buffer;
      }
    } catch (error) {
      console.error(`[apple]Error downloading ${url}:`, error);
      throw error;
    }
  }

  /**
   * 申请测试通知，以验证接口是否正常
   * @returns
   */
  async requestNotification(): Promise<SendTestNotificationResponse> {
    return await this.client.requestTestNotification();
  }

  /**
   * 解码通知
   * @param signedPayload
   * @returns
   */
  async decodeNotify({ signedPayload }) {
    const notice: ResponseBodyV2DecodedPayload = await this.verifier.verifyAndDecodeNotification(signedPayload);
    const { signedTransactionInfo, signedRenewalInfo } = notice.data;
    const trans = await this.verifier.verifyAndDecodeTransaction(signedTransactionInfo);
    const renewalInfo = await this.verifier.verifyAndDecodeRenewalInfo(signedRenewalInfo);
    Object.assign(notice.data, { transactionInfo: trans, renewalInfo });
    return notice;
  }

  private formatSubscriptionState(state: string, expireTime: number) {
    if (['REVOKED'].includes(state) || expireTime < Date.now()) {
      return state;
    }
    return 'ACTIVE';
  }

  /**
   * 解码客户端交易信息
   * @param appReceipt
   * @returns
   */
  async decodeTransaction(appReceipt: string) {
    const trans = await this.verifier.verifyAndDecodeTransaction(appReceipt);

    return {
      // 应用消息
      bundleId: trans.bundleId,
      environment: trans.environment === 'Sandbox' ? 'Sandbox' : 'Production',
      // channel: 'AppleStore',

      // 订阅信息
      productId: trans.productId,
      groupId: trans.subscriptionGroupIdentifier,
      startTime: new Date(trans.purchaseDate).toISOString(),
      expireTime: new Date(trans.expiresDate).toISOString(),
      state: this.formatSubscriptionState('', trans.expiresDate),

      // 交易信息
      billing: {
        transactionId: trans.transactionId,
        priceRegionCode: trans.storefront,
        priceCurrency: trans.currency || '',
        priceAmount: trans.price || 0,
        ownershipType: trans.inAppOwnershipType,
        // ownershipId: trans?.deviceVerificationNonce,
      },
      // 续约信息
      renewal: {
        transactionId: trans.originalTransactionId,
        productId: trans.productId,
        autoRenewStatus: 1,
        renewalDate: new Date(trans.expiresDate).toISOString(),
      },
    };
  }
}
