import { Type } from '@nestjs/common';

export interface PaymentModuleOptions {
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

export interface PaymentModuleAsyncOptions {
  imports?: any[];
  useExisting?: Type<PaymentConfigFactory>;
  useClass?: Type<PaymentConfigFactory>;
  useFactory?: (...args: any[]) => Promise<PaymentModuleOptions> | PaymentModuleOptions;
  inject?: any[];
}

export interface PaymentConfigFactory {
  createPaymentConfig(): Promise<PaymentModuleOptions> | PaymentModuleOptions;
}
