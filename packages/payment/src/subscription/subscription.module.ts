import { DynamicModule, Global, Module } from '@nestjs/common';

import Providers from './provider';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { subscription } from './types';
export * from './types';

@Global()
@Module({})
export class SubscriptionModule {
  static forRoot(options: subscription.Options): DynamicModule {
    return {
      module: SubscriptionModule,
      controllers: [SubscriptionController],
      providers: [
        {
          provide: 'CONFIG',
          useValue: options,
        },
        SubscriptionService,
        ...Providers,
      ],
      exports: [SubscriptionService, ...Providers],
    };
  }

  static forRootAsync(options: subscription.AsyncOptions): DynamicModule {
    return {
      module: SubscriptionModule,
      controllers: [SubscriptionController],
      providers: [
        {
          provide: 'CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        ...Providers,
        SubscriptionService,
      ],
      exports: [SubscriptionService, ...Providers],
    };
  }
}
