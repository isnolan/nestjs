import { Injectable } from '@nestjs/common';
import fs from 'fs';
import { Auth, google } from 'googleapis';

// import moment from 'moment-timezone';
import { NotificationType } from './constant';
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
 *
 * 3、OAuth 2.0: refresh_token
 * https://developers.google.com/android-publisher/getting_started?hl=zh-cn#oauth
 * https://www.wuguozhang.com/archives/54/comment-page-1
 */
@Injectable()
export class GoogleProviderService {
  // private readonly credentials = JSON.parse(fs.readFileSync('./certs/chatonce-service-web.json', 'utf8'));
  private readonly oauth2Client: Auth.OAuth2Client;
  private readonly packageName = 'ai.draftai.app.chatonce';
  private readonly publisher = google.androidpublisher({ version: 'v3' });

  constructor() {
    // service account auth
    const auth = new google.auth.GoogleAuth({
      keyFile: './certs/darftai-ef4358ae5437.json',
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    google.options({ auth });
  }

  /**
   * 解码通知消息
   * @doc https://developers.google.com/android-publisher/api-ref/purchases/subscriptions/get
   */
  async decodeNotify(payload: any) {
    // Base64-decode the message data
    const decodedData = Buffer.from(payload.message.data, 'base64').toString('utf8');
    const notice = JSON.parse(decodedData);
    let notification: any;

    // 订阅消息
    if (notice?.subscriptionNotification) {
      const { subscriptionId, purchaseToken, notificationType } = notice.subscriptionNotification;
      const { transactionInfo, transaction } = await this.getSubscription(subscriptionId, purchaseToken);
      Object.assign(notice.subscriptionNotification, { transactionInfo });

      notification = {
        notificationId: payload.message.messageId as string,
        notificationType: this.formatNotificationType(notificationType),
        subscrption: transaction,
        notificationTime: payload.message.publishTime as string,
      };
    }

    // 退款消息
    if (notice?.voidedPurchaseNotification) {
      const { orderId: transactionId } = notice.voidedPurchaseNotification;
      const voidedpurchases = await this.voidedpurchases();
      Object.assign(notice.voidedPurchaseNotification, { voidedpurchases });

      notification = {
        notificationId: payload.message.messageId as string,
        notificationType: 'REFUND',
        voidedpurchases: { transactionId, ...voidedpurchases },
        notificationTime: payload.message.publishTime as string,
      };
    }

    // const time = moment().tz('Asia/Shanghai').format('YYMMDDHHmmssSSS');
    // fs.writeFileSync(`./notify/${time}_google.json`, JSON.stringify({ notice, notification }, null, 2));

    return notification;
  }

  /**
   * 格式化通知状态
   * https://developer.android.com/google/play/billing/rtdn-reference?hl=zh-cn#sub
   */
  private formatNotificationType(notificationType: number): NotificationType {
    switch (notificationType) {
      case 1: // SUBSCRIPTION_RECOVERED
      case 4: // SUBSCRIPTION_PURCHASED
        return NotificationType.SUBSCRIBED; // 从帐号保留状态恢复了订阅或购买了新的订阅 (Case 1)

      case 2: // SUBSCRIPTION_RENEWED
      case 7: // SUBSCRIPTION_RESTARTED
        return NotificationType.RENEWED; // 续订了处于活动状态的订阅或订阅已取消，但在用户恢复时尚未到期 (Case 2)

      case 3: // SUBSCRIPTION_CANCELED
        return NotificationType.CANCELLED; // 自愿或非自愿地取消了订阅 (Case 5)

      case 5: // SUBSCRIPTION_ON_HOLD
      case 13: // SUBSCRIPTION_EXPIRED
        return NotificationType.EXPIRED; // 订阅已到期，或帐号保留视为过期 (Case 4)

      case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
        return NotificationType.GRACE_PERIOD; // 宽限期内 (Case 3)

      case 9: // SUBSCRIPTION_DEFERRED
        return NotificationType.DEFERRED; // 订阅的续订时间点已延期 (Case 6)

      case 12: // SUBSCRIPTION_REVOKED
        return NotificationType.REFUND; // 用户在到期时间之前已撤消订阅 (Case 7)

      default:
        return NotificationType.OTHER; // 其他未覆盖的情况返回空字符串
    }
  }

  private formatSubscriptionState(state: string) {
    switch (state) {
      case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
        return 'GRACE_PERIOD';
      case 'SUBSCRIPTION_STATE_CANCELED':
        return 'CANCELLED';
      case 'SUBSCRIPTION_STATE_ON_HOLD':
      case 'SUBSCRIPTION_STATE_EXPIRED':
        return 'Expired';
      default:
        return 'ACTIVE';
    }
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
    // 确认凭证
    if (subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' && acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
      await this.acknowledgePurchase(productId, token); // 确认凭证
    }

    const { lineItems, regionCode } = trans;
    const { price } = await this.getRegionalPrice(productId, lineItems[0].offerDetails.basePlanId, regionCode);
    const { units, nanos } = price;

    let stateReason = '';
    if ('canceledStateContext' in trans) {
      if ('systemInitiatedCancellation' in trans.canceledStateContext) {
        stateReason = 'system cancel';
      }
      if ('userInitiatedCancellation' in trans.canceledStateContext) {
        stateReason = 'user cancel';
      }
    }

    const transaction = {
      // 应用消息
      bundleId: `ai.draftai.app.chatonce`,
      environment: 'testPurchase' in trans ? 'Sandbox' : 'Production',

      // 订阅信息
      productId: lineItems[0].productId,
      basePlanId: lineItems[0].offerDetails.basePlanId,
      startTime: trans.startTime,
      expireTime: trans.lineItems[0].expiryTime,
      state: this.formatSubscriptionState(subscriptionState),
      stateReason,

      // 交易信息
      billing: {
        transactionId: trans.latestOrderId,
        priceRegionCode: trans.regionCode,
        priceCurrency: price.currencyCode,
        priceAmount: Number(units) * 1000 + (nanos ? Number(nanos) / 1000000 : 0),
        ownershipType: 'PURCHASED',
      },

      // 续约信息
      renewal: {
        transactionId: trans.latestOrderId.split('..')[0],
        productId: lineItems[0].productId,
        autoRenewStatus: lineItems[0].autoRenewingPlan.autoRenewEnabled ? 1 : 0,
        renewalDate: lineItems[0].expiryTime,
      },
    };

    return { transaction, transactionInfo: trans };
  }

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
