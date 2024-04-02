import { Type } from '@nestjs/common';

export interface Options {
  google?: {
    clientId: string;
  };
  // apple?: {};
}

export interface AsyncOptions {
  imports?: any[];
  useExisting?: Type<Config>;
  useClass?: Type<Config>;
  useFactory?: (...args: any[]) => Promise<Options> | Options;
  inject?: any[];
}

export interface Config {
  createAuthConfig(): Promise<Options> | Options;
}

export interface SocialDto {
  email: string;
  emailVerified: boolean;
  openId: string;
  unionId?: string;
  appId: string;
  nickname?: string;
  avatar?: string;
  locale?: string;
}
