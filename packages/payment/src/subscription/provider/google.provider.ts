import { Inject, Injectable } from '@nestjs/common';
import { google } from 'googleapis';

import type { subscription } from '../types';
// import { ProviderNotificationDto, ProviderSubscription } from './dto/decode-transaction.dto';
// import { GoogleAuthProfile, GoogleReginPrice } from './interface/google.interface';
/**
 * Play Developer API Auth by 3 ways:
 * 1、Service accounts: keyFile
 * https://developers.google.com/android-publisher/getting_started?hl=zh-cn#service-account
 * https://github.com/googleapis/google-api-nodejs-client#using-the-keyfile-property
 *
 * 2、Service accounts: jwt
 * https://gist.github.com/jeffhuangtw/4b0c1d9ceff280c85505fe84f1dc9020
 * https://github.com/Bang9/android-get-access-token-example
 * https://github.com/googleapis/google-auth-library-nodejs
 *
 * 3、OAuth 2.0: refresh_token
 * https://developers.google.com/android-publisher/getting_started?hl=zh-cn#oauth
 * https://www.wuguozhang.com/archives/54/comment-page-1
 */
@Injectable()
export class GoogleProviderService {
  private readonly packageName: string;
  private readonly publisher = google.androidpublisher({ version: 'v3' });

  constructor(@Inject('CONFIG') private readonly config: subscription.Options) {
    this.packageName = this.config.google.packageName;

    // service account auth
    const auth = new google.auth.JWT({
      email: this.config.google.clientEmail,
      key: this.config.google.privateKey,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    google.options({ auth });
  }

  /**
   * 解码通知消息
   * @doc https://developers.google.com/android-publisher/api-ref/purchases/subscriptions/get
   */
  async validateWebhookSignature({ message: m }): Promise<subscription.Notice> {
    // Base64-decode the message data
    const decodedData = Buffer.from(m.data, 'base64').toString('utf8');
    const n = JSON.parse(decodedData);

    // 订阅消息
    if (n?.subscriptionNotification) {
      const { subscriptionId, purchaseToken, notificationType: type } = n.subscriptionNotification;
      const trans = await this.getSubscription(subscriptionId, purchaseToken);

      const id = m.messageId;
      const notice: subscription.Notice = { id, type: 'UNHANDLED', original: { type, data: m } };
      console.log(`->trans`, trans);

      // case1: SUBSCRIBED
      if ([1, 4].includes(type)) {
        const subscription = await this.formatEventBySubscribed(trans);
        return { ...notice, type: 'SUBSCRIBED', subscription };
      }

      // case2: RENEWED
      if ([2, 7].includes(type)) {
        const subscription = await this.formatEventBySubscribed(trans);
        return { ...notice, type: 'RENEWED', subscription };
      }

      // case3: Grace Period
      if ([6].includes(type)) {
        const subscription = this.formatEventByGracePeriod(trans);
        return { ...notice, type: 'GRACE_PERIOD', subscription };
      }

      // case4: Expired
      if ([5, 13].includes(type)) {
        const subscription = this.formatEventByCommon(trans);
        return { ...notice, type: 'GRACE_PERIOD', subscription };
      }

      // case5: Cancelled, cancel at period end
      if ([3].includes(type)) {
        const subscription = await this.formatEventByCancel(trans);
        return { ...notice, type: 'CANCELLED', subscription };
      }

      // case6: Revoked, cancel at now
      if ([12].includes(type)) {
        const subscription = this.formatEventByCancel(trans, true);
        return { ...notice, type: 'CANCELLED', subscription };
      }

      return notice;
    }

    // 退款消息
    // if (n?.voidedPurchaseNotification) {
    //   const { purchaseToken } = n.voidedPurchaseNotification;
    //   const subscription = await this.validateReceipt(purchaseToken);
    //   return {
    //     type: 'REFUND',
    //     id: message.messageId as string,
    //     subscription,
    //     original: notice,
    //     provider: 'Google',
    //   };
    // }

    // return notice;
  }

  /**
   * 获得订阅详情
   * https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2?hl=zh-cn#SubscriptionPurchaseV2
   * @param subscriptionId
   * @param token
   * @returns
   */
  async getSubscription(productId: string, token: string) {
    const packageName = this.packageName;
    const { data: trans } = await this.publisher.purchases.subscriptionsv2.get({ packageName, token });
    const { subscriptionState, acknowledgementState } = trans;

    if (subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' && acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
      await this.acknowledgePurchase(productId, token); // 确认凭证
    }

    return trans;
  }

  private async formatEventBySubscribed(trans): Promise<subscription.Subscription> {
    const { lineItems, regionCode } = trans;
    const { productId, offerDetails } = lineItems[0];
    const { price } = await this.getRegionalPrice(productId, offerDetails.basePlanId, regionCode);
    const { units, nanos } = price;

    return {
      subscription_id: trans.latestOrderId.split('..')[0],
      period_start: trans.startTime,
      period_end: trans.lineItems[0].expiryTime,
      state: 'Active' as subscription.State,

      transaction: {
        transaction_id: trans.latestOrderId,
        price_id: lineItems[0].productId,
        region: regionCode,
        amount: Number(units) * 1000 + (nanos ? Number(nanos) / 1000000 : 0),
        currency: price.currencyCode,
      },
    };
  }

  private formatEventByGracePeriod(trans): subscription.Subscription {
    return {
      subscription_id: trans.latestOrderId.split('..')[0],
      period_start: trans.startTime,
      period_end: trans.lineItems[0].expiryTime,
      state: 'Paused' as subscription.State,
    };
  }

  private formatEventByCommon(trans): subscription.Subscription {
    return {
      subscription_id: trans.latestOrderId.split('..')[0],
      period_start: trans.startTime,
      period_end: trans.lineItems[0].expiryTime,
      state: 'Active' as subscription.State,
    };
  }

  private formatEventByCancel(trans, immediate = false): subscription.Subscription {
    let reason = '';
    if ('canceledStateContext' in trans) {
      if ('systemInitiatedCancellation' in trans.canceledStateContext) {
        reason = 'system cancel';
      }
      if ('userInitiatedCancellation' in trans.canceledStateContext) {
        reason = 'user cancel';
      }
    }

    return {
      subscription_id: trans.latestOrderId.split('..')[0],
      period_start: trans.startTime,
      period_end: trans.lineItems[0].expiryTime,
      state: immediate ? 'Cancelled' : 'Active',

      cancellation: {
        reason,
        time_at: new Date(trans.signedDate).toISOString(),
      },
    };
  }

  private formatSubscriptionState(state: string): subscription.State {
    switch (state) {
      case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
        return 'Paused';
      case 'SUBSCRIPTION_STATE_CANCELED':
        return 'Cancelled';
      case 'SUBSCRIPTION_STATE_ON_HOLD':
      case 'SUBSCRIPTION_STATE_EXPIRED':
        return 'Expired';
      default:
        return 'Active';
    }
  }

  /**
   * 获得订阅详情
   * https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2?hl=zh-cn#SubscriptionPurchaseV2
   * @param subscriptionId
   * @param token
   * @returns
   */
  async validateReceipt(token: string): Promise<subscription.Subscription> {
    const { packageName } = this;
    const { data: trans } = await this.publisher.purchases.subscriptionsv2.get({ packageName, token });
    const { subscriptionState, acknowledgementState } = trans;
    // 确认凭证
    if (subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' && acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
      await this.acknowledgePurchase(packageName, token); // 确认凭证
    }

    const { lineItems, regionCode } = trans;
    const { price } = await this.getRegionalPrice(packageName, lineItems[0].offerDetails.basePlanId, regionCode);
    const { units, nanos } = price;

    return {
      // 应用消息
      subscription_id: trans.latestOrderId.split('..')[0],
      // productId: lineItems[0].productId,
      period_start: trans.startTime,
      period_end: trans.lineItems[0].expiryTime,
      state: this.formatSubscriptionState(subscriptionState),

      // 交易信息
      // billing: {
      //   transactionId: trans.latestOrderId,
      //   regionCode: trans.regionCode,
      //   currency: price.currencyCode,
      //   price: Number(units) * 1000 + (nanos ? Number(nanos) / 1000000 : 0),
      // },

      // isAutoRenew: lineItems[0].autoRenewingPlan.autoRenewEnabled ? 1 : 0,
    };
  }

  /**
   * 格式化通知状态
   * https://developer.android.com/google/play/billing/rtdn-reference?hl=zh-cn#sub
   */
  // formatNoticeType(notificationType: number): subscription.NoticeType {
  //   switch (notificationType) {
  //     case 1: // SUBSCRIPTION_RECOVERED
  //     case 4: // SUBSCRIPTION_PURCHASED
  //       return subscription.NoticeType.SUBSCRIBED; // 从帐号保留状态恢复了订阅或购买了新的订阅 (Case 1)

  //     case 2: // SUBSCRIPTION_RENEWED
  //     case 7: // SUBSCRIPTION_RESTARTED
  //       return subscription.NoticeType.RENEWED; // 续订了处于活动状态的订阅或订阅已取消，但在用户恢复时尚未到期 (Case 2)

  //     case 3: // SUBSCRIPTION_CANCELED
  //       return subscription.NoticeType.CANCELLED; // 自愿或非自愿地取消了订阅 (Case 5)

  //     case 5: // SUBSCRIPTION_ON_HOLD
  //     case 13: // SUBSCRIPTION_EXPIRED
  //       return subscription.NoticeType.EXPIRED; // 订阅已到期，或帐号保留视为过期 (Case 4)

  //     case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
  //       return subscription.NoticeType.GRACE_PERIOD; // 宽限期内 (Case 3)

  //     case 9: // SUBSCRIPTION_DEFERRED
  //       return subscription.NoticeType.DEFERRED; // 订阅的续订时间点已延期 (Case 6)

  //     case 12: // SUBSCRIPTION_REVOKED
  //       return subscription.NoticeType.REFUND; // 用户在到期时间之前已撤消订阅 (Case 7)

  //     default:
  //       return subscription.NoticeType.OTHER; // 其他未覆盖的情况返回空字符串
  //   }
  // }

  /**
   * 获取基本订阅计划
   * @returns
   */
  async getRegionalPrice(productId: string, basePlanId: string, regionCode: string) {
    const { data } = await this.publisher.monetization.subscriptions.get({ packageName: this.packageName, productId });
    const basePlan = data.basePlans.find((item) => item.basePlanId === basePlanId);
    const regionalConfig = basePlan.regionalConfigs.find((item) => item.regionCode === regionCode);
    return regionalConfig;
  }

  /**
   * 确认消耗
   */
  async acknowledgePurchase(subscriptionId: string, token: string) {
    const packageName = this.packageName;
    await this.publisher.purchases.subscriptions.acknowledge({ packageName, subscriptionId, token });
  }

  /**
   * 用户作废的购买交易相关的订单列表
   * @returns
   */
  async voidedpurchases() {
    const { data } = await this.publisher.purchases.voidedpurchases.list({ packageName: this.packageName });
    return data;
  }

  /**
   * 取消当前订阅
   * @param subscriptionId
   * @returns
   */
  async cancelSubscription(subscriptionId: string) {
    const { data } = await this.publisher.purchases.subscriptions.cancel({
      packageName: this.packageName,
      subscriptionId,
    });
    return data;
  }

  /**
   * 推迟当前订阅
   * @param subscriptionId
   * @returns
   */
  async deferSubscription(subscriptionId: string) {
    const { data } = await this.publisher.purchases.subscriptions.defer({
      packageName: this.packageName,
      subscriptionId,
    });
    return data;
  }

  async refundSubscription(orderId: string) {
    const { data } = await this.publisher.orders.refund({
      packageName: this.packageName,
      orderId,
    });

    // const {data} = await this.publisher.purchases.subscriptions.refund({
    //   packageName: this.packageName,
    //   subscriptionId,
    // });
    return data;
  }
}
