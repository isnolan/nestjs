import { AppStoreServerAPIClient, ResponseBodyV2DecodedPayload } from '@apple/app-store-server-library';
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';
import { Inject, Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

import { subscription } from '../types';

@Injectable()
export class AppleProviderService {
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

  public async validateWebhookSignature({ signedPayload }): Promise<subscription.Notice> {
    const notice: ResponseBodyV2DecodedPayload = await this.verifier.verifyAndDecodeNotification(signedPayload);
    const transactionInfo = await this.validateReceipt(notice.data.signedTransactionInfo);
    const renewalInfo = await this.verifier.verifyAndDecodeRenewalInfo(notice.data.signedRenewalInfo);
    Object.assign(notice.data, { transactionInfo, renewalInfo });
    delete notice.data.signedTransactionInfo;
    delete notice.data.signedRenewalInfo;

    return {
      type: this.formatNotificationType(notice.notificationType, notice.subtype),
      noticeId: notice.notificationUUID as string,
      subscription: transactionInfo,
    };
  }

  public async validateReceipt(purchaseToken: string): Promise<subscription.Subscription> {
    const trans = await this.verifier.verifyAndDecodeTransaction(purchaseToken);
    return {
      platform: 'Apple',
      subscriptionId: trans.originalTransactionId,
      productId: trans.productId,
      startTime: new Date(trans.purchaseDate).toISOString(),
      expireTime: new Date(trans.expiresDate).toISOString(),
      state: this.formatSubscriptionState('', trans.expiresDate),
      // 账单
      billing: {
        transactionId: trans.transactionId,
        regionCode: trans.storefront,
        currency: trans.currency || '',
        price: trans.price || 0,
      },
      // 续订
      isAutoRenew: 1,
    };
  }

  /**
   * 格式化通知状态
   * https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
   */
  private formatNotificationType(type: string, subType: string): subscription.NoticeType {
    // Case: 1. 新增/重新订阅 SUBSCRIBED 生成订阅、订单和交易记录
    if (type === 'SUBSCRIBED' && ['INITIAL_BUY', 'RESUBSCRIBE'].includes(subType)) {
      return subscription.NoticeType.SUBSCRIBED;
    }

    // Case: 2. 续订成功/续订宽限恢复 RENEW 延长订阅记录，生成新订单和交易记录
    if (type === 'DID_RENEW') {
      return subscription.NoticeType.RENEWED;
    }

    // Case: 3. 续订宽限 RENEW_GRACE 标记订阅状态（宽限）
    if (type === 'DID_FAIL_TO_RENEW' && subType === 'GRACE_PERIOD') {
      return subscription.NoticeType.GRACE_PERIOD;
    }

    // Case: 4. 到期/续订宽限失败 EXPIRED 标记订阅状态（过期）
    if (['EXPIRED', 'GRACE_PERIOD_EXPIRED'].includes(type)) {
      return subscription.NoticeType.EXPIRED;
    }

    // Case: 5. 订阅取消 CANCELLED
    if (type === 'DID_CHANGE_RENEWAL_STATUS' && subType === 'AUTO_RENEW_DISABLED') {
      return subscription.NoticeType.CANCELLED;
    }

    // Case: 6. 续订延期 DEFERRED
    if ((type === 'RENEWAL_EXTENDED' || type === 'RENEWAL_EXTENSION') && subType !== 'FAILURE') {
      return subscription.NoticeType.DEFERRED;
    }

    // Case: 7. 退款, REFUND, 生成退款单据和交易记录
    if (type === 'REFUND') {
      return subscription.NoticeType.REFUND;
    }

    // Case: 8. 撤销订阅(系统或用户), REVOKED, 失去访问资格
    if (type === 'REVOKED') {
      return subscription.NoticeType.REVOKED;
    }

    // Case: 9. 订阅升/降级 CHANGED 生成新订单和交易记录
    if (type === 'DID_CHANGE_RENEWAL_PREF' && ['UPGRADE', 'DOWNGRADE'].includes(subType)) {
      return subscription.NoticeType.CHANGED;
    }
    // Default case for unmapped notifications
    // return `[Unsupport]${type}:${subType}`;
    return subscription.NoticeType.OTHER;
  }

  private formatSubscriptionState(state: string, expireTime: number): subscription.SubscriptionState {
    if (['REVOKED'].includes(state) || expireTime < Date.now()) {
      return state as subscription.SubscriptionState;
    }
    return 'ACTIVE';
  }
}
