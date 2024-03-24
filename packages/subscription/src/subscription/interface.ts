import { Type } from '@nestjs/common';

export interface SubscriptionModuleOptions {
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
    bundleId: string;
    environment: 'Sandbox' | 'Production';
  };
}

export interface SubscriptionModuleAsyncOptions {
  imports?: any[];
  useExisting?: Type<SubscriptionConfigFactory>;
  useClass?: Type<SubscriptionConfigFactory>;
  useFactory?: (...args: any[]) => Promise<SubscriptionModuleOptions> | SubscriptionModuleOptions;
  inject?: any[];
}

export interface SubscriptionConfigFactory {
  createSubscriptionConfig(): Promise<SubscriptionModuleOptions> | SubscriptionModuleOptions;
}
