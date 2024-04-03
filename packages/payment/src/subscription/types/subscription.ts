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
      appAppleId?: number; // production only
      signingKey: string;
      keyId: string;
      issuerId: string;
      bundleId: string;
      environment: 'Sandbox' | 'Production';
    };
  }

  export interface AsyncOptions {
    imports?: any[];
    useExisting?: Type<Config>;
    useClass?: Type<Config>;
    useFactory?: (...args: any[]) => Promise<Options> | Options;
    inject?: any[];
  }

  export interface Config {
    createSubscriptionConfig(): Promise<Options> | Options;
  }

  // export enum NoticeType {
  // SUBSCRIBED = 'SUBSCRIBED', // 表示用户新订阅了服务，含: 订阅信息 + 交易信息
  // RENEWED = 'RENEWED', // 表示用户的订阅已经续订，含: 订阅信息 + 交易信息
  // GRACE_PERIOD = 'GRACE_PERIOD', // 表示用户的订阅已过期，但是处于宽限期内，可能还可以恢复，含: 订阅信息
  // EXPIRED = 'EXPIRED', // 表示订阅已完全过期（含超过宽限期），无法自动续订，需重新开始新的订阅，含: 订阅信息
  // CANCELLED = 'CANCELLED', // 用户(或系统)取消订阅，需重新开始新的订阅，含: 订阅信息
  // REFUND = 'REFUND', // 用户获得了退款，含：订阅信息 + 退款信息
  // }

  /**
   * SUBSCRIBED = 'SUBSCRIBED', // 表示用户新订阅了服务并支付成功，含: 订阅信息 + 交易信息
   * RENEWED = 'RENEWED', // 表示用户的订阅已经续订成功，含: 订阅信息 + 交易信息
   * GRACE_PERIOD = 'GRACE_PERIOD', // 表示用户的订阅计划已过期，但是处于宽限期内，可能还可以恢复，含: 订阅信息
   * EXPIRED = 'EXPIRED', // 表示订阅已完全过期（含超过宽限期），无法自动续订，需重新开始新的订阅，含: 订阅信息
   * CANCELLED = 'CANCELLED', // 用户(或系统)取消订阅，需重新开始新的订阅，含: 订阅信息, 如何是当前计划取消则包含cancelletion信息
   */
  export type NoticeType = 'SUBSCRIBED' | 'RENEWED' | 'GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED' | 'UNHANDLED';

  export interface Notice {
    id: string;
    type: NoticeType;
    original: any;
    subscription?: Subscription;
  }

  /**
   * 订阅类型
   * ACTIVE：表示订阅处于活跃状态。
   * PAUSED：表示订阅处于暂停状态。
   * EXPIRED：表示订阅已过期。
   * CANCELLED：表示用户取消了订阅。
   */
  export type State = 'active' | 'suspend' | 'expired' | 'cancelled';

  export interface Subscription {
    provider: 'apple' | 'google' | 'stripe';
    subscription_id: string;
    period_start: string;
    period_end: string;
    state: State; // 订阅状态

    transaction?: Transaction;
    cancellation?: Cancellation;
    customer?: Customer; // stripe only
  }

  export interface Transaction {
    transaction_id: string;
    product_id: string;
    region: string;
    amount: number; // 考虑到不同货币可能需要处理的金额单位问题，这里表示的是转换为主要货币单位后的金额
    currency: string;
  }

  export interface Cancellation {
    reason: string;
    time_at: string;
  }

  export interface Customer {
    id: string;
    email: string;
    name: string;
  }
}
