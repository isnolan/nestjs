import { AppStoreServerAPIClient, ResponseBodyV2DecodedPayload } from '@apple/app-store-server-library';
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';
import { Inject, Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

import type { subscription } from '../types';

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

  public async requestTestNotification() {
    return this.client.requestTestNotification();
  }

  /**
   * 格式化通知状态
   * https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
   */
  public async validateWebhookSignature({ signedPayload }): Promise<subscription.Notice> {
    const n: ResponseBodyV2DecodedPayload = await this.verifier.verifyAndDecodeNotification(signedPayload);
    const { notificationUUID: id, notificationType: type, subtype } = n;
    const notice: subscription.Notice = { id, type: 'UNHANDLED', original: { type, data: n } };

    if (n.data?.signedTransactionInfo) {
      const transactionInfo = await this.verifier.verifyAndDecodeTransaction(n.data.signedTransactionInfo);
      Object.assign(n.data, { transactionInfo });

      // case1: SUBSCRIBED OR RENEWED
      if (type === 'SUBSCRIBED' && ['INITIAL_BUY', 'RESUBSCRIBE'].includes(subtype)) {
        const subscription = this.formatEventBySubscribed(transactionInfo);
        return { ...notice, type: 'SUBSCRIBED', subscription };
      }

      // case2: RENEWED
      if (type === 'DID_RENEW') {
        const subscription = this.formatEventBySubscribed(transactionInfo);
        return { ...notice, type: 'RENEWED', subscription };
      }

      // case3: GRACE_PERIOD
      if (type === 'DID_FAIL_TO_RENEW' && subtype === 'GRACE_PERIOD') {
        const subscription = this.formatEventByCommon(transactionInfo);
        return { ...notice, type: 'GRACE_PERIOD', subscription };
      }

      // case4: EXPIRED
      if (['EXPIRED', 'GRACE_PERIOD_EXPIRED'].includes(type)) {
        const subscription = this.formatEventByCommon(transactionInfo);
        return { ...notice, type: 'EXPIRED', subscription };
      }

      // case5: CANCELLED
      if (type === 'DID_CHANGE_RENEWAL_STATUS' && subtype === 'AUTO_RENEW_DISABLED') {
        const subscription = this.formatEventByCancel(transactionInfo);
        return { ...notice, type: 'CANCELLED', subscription };
      }

      // case6: REFUND or REVOKED
      if (['REFUND', 'REVOKED'].includes(type)) {
        const subscription = this.formatEventByCancel(transactionInfo, true);
        return { ...notice, type: 'CANCELLED', subscription };
      }
    }

    // if (n.data?.signedRenewalInfo) {
    //   const renewalInfo = await this.verifier.verifyAndDecodeRenewalInfo(n.data.signedRenewalInfo);
    //   Object.assign(n.data, { renewalInfo });
    // }

    return notice;
  }

  public async validateReceipt(purchaseToken: string): Promise<subscription.Subscription> {
    const trans = await this.verifier.verifyAndDecodeTransaction(purchaseToken);
    return {
      subscription_id: trans.originalTransactionId,
      period_start: new Date(trans.purchaseDate).toISOString(),
      period_end: new Date(trans.expiresDate).toISOString(),
      state: this.formatSubscriptionState('', trans.expiresDate),

      transaction: {
        transaction_id: trans.transactionId,
        product_id: trans.productId,
        region: trans.storefront,
        amount: trans.price,
        currency: trans.currency,
      },
    };
  }

  private formatEventBySubscribed(trans): subscription.Subscription {
    return {
      subscription_id: trans.originalTransactionId,
      period_start: new Date(trans.purchaseDate).toISOString(),
      period_end: new Date(trans.expiresDate).toISOString(),
      state: 'Active' as subscription.State,

      transaction: {
        transaction_id: trans.transactionId,
        product_id: trans.productId,
        region: trans.storefront,
        amount: trans.price,
        currency: trans.currency,
      },
    };
  }

  private formatEventByCommon(trans): subscription.Subscription {
    return {
      subscription_id: trans.originalTransactionId,
      period_start: new Date(trans.purchaseDate).toISOString(),
      period_end: new Date(trans.expiresDate).toISOString(),
      state: 'Active' as subscription.State,
    };
  }

  private formatEventByCancel(trans, immediate = false): subscription.Subscription {
    return {
      subscription_id: trans.originalTransactionId,
      period_start: new Date(trans.purchaseDate).toISOString(),
      period_end: new Date(trans.expiresDate).toISOString(),
      state: immediate ? 'Cancelled' : 'Active',

      cancellation: {
        reason: '',
        time_at: new Date(trans.signedDate).toISOString(),
      },
    };
  }

  private formatSubscriptionState(state: string, expireTime: number): subscription.State {
    if (['REVOKED'].includes(state) || expireTime < Date.now()) {
      return 'Cancelled' as subscription.State;
    }

    return 'Active';
  }
}
