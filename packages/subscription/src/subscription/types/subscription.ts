import { Type } from '@nestjs/common';

export namespace subscription {
  export interface Options {
    rawBodyKey?: 'rawBody';
    stripe?: {
      apiSecretKey: string;
      webhookSecret: string;
    };
    google?: {
      packageName: string;
      clientEmail: string;
      privateKey: string;
    };
    apple?: {
      signingKey: string;
      keyId: string;
      issuerId: string;
      bundleId: string;
      environment: 'Sandbox' | 'Production';
    };
  }

  export interface AsyncOptions {
    imports?: any[];
    useExisting?: Type<ConfigFactory>;
    useClass?: Type<ConfigFactory>;
    useFactory?: (...args: any[]) => Promise<Options> | Options;
    inject?: any[];
  }

  export interface ConfigFactory {
    createSubscriptionConfig(): Promise<Options> | Options;
  }

  /**
   * 订阅活动类型
   */
  export enum NoticeType {
    SUBSCRIBED = 'SUBSCRIBED',
    RENEWED = 'RENEWED',
    GRACE_PERIOD = 'GRACE_PERIOD',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
    DEFERRED = 'DEFERRED',
    REFUND = 'REFUND',
    REVOKED = 'REVOKED',
    CHANGED = 'CHANGED',
    TEST = 'TEST',
    OTHER = 'OTHER',
  }

  export type SubscriptionState = 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELLED';

  export interface Subscription {
    platform: 'Google' | 'Apple' | 'Stripe';
    subscriptionId: string;
    productId: string;
    startTime: string;
    expireTime: string;
    state: SubscriptionState; // 订阅状态
    billing: {
      transactionId: string;
      regionCode: string;
      currency: string;
      price: number;
    };
    isAutoRenew: 0 | 1; // 是否续订
  }
  export interface Notice {
    type: string;
    id: string;
    payload: any;
    subscription?: Subscription;
  }
}
