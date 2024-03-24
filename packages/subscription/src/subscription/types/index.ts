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
}
