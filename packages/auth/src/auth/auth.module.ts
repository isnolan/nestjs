import { DynamicModule, Global, Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import Providers from './provider';
import * as types from './types';

@Global()
@Module({})
export class AuthModule {
  static forRoot(options: types.Options): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: 'CONFIG',
          useValue: options,
        },
        AuthService,
        ...Providers,
      ],
      exports: [AuthService],
    };
  }

  static forRootAsync(options: types.AsyncOptions): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: 'CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        ...Providers,
        AuthService,
      ],
      exports: [AuthService],
    };
  }
}
