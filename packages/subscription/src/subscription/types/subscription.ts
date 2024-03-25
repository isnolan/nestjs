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

  export interface Notice {
    notice_type: string;
    notice_id: string;
    notice_time: string;

    // provider
    provider: 'google' | 'apple' | 'stripe';

    // 订阅信息
    subscription: {
      id: string;
      product_id: string;
      start_time: string;
      expire_time: string;
      state: string; // 订阅状态
      auto_renew: number; // 是否续订
    };

    // 交易信息
    transaction: {
      id: string;
      price: number;
      region: string;
      currency: string;
    };

    // 应用信息
    app: {
      package_name: string;
    };
  }
}
