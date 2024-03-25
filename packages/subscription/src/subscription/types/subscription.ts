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
      serviceAccountEmail: string;
      privateKey: string;
      projectId: string;
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

  export interface Notification {
    platform: 'google' | 'apple' | 'stripe';
    type: string;
    // 订阅信息
    subscription: {
      // plan
      product_id: string;
      start_time: string;
      expire_time: string;
      is_renewing: boolean;
      state: string; // 订阅状态

      // transaction
      subscription_id: string;
      transaction_id: string;
      price_amount: number;
      region_code: string;
      currency: string;
    };

    // 交易信息
  }
}
