import { DynamicModule, Global, Module, Provider } from '@nestjs/common';

import Providers from './provider';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { subscription } from './types';

@Global()
@Module({})
export class SubscriptionModule {
  static forRoot(config: subscription.Options): DynamicModule {
    return {
      module: SubscriptionModule,
      controllers: [SubscriptionController],
      providers: [{ provide: 'CONFIG', useValue: config }, SubscriptionService, ...Providers],
      exports: [SubscriptionService],
    };
  }

  static forRootAsync(options: subscription.AsyncOptions): DynamicModule {
    return {
      module: SubscriptionModule,
      imports: options.imports || [],
      controllers: [SubscriptionController],
      providers: [this.createAsyncProviders(options), SubscriptionService, ...Providers],
      exports: [SubscriptionService],
    };
  }

  private static createAsyncProviders(options: subscription.AsyncOptions): Provider {
    if (options.useExisting || options.useFactory) {
      return {
        provide: 'CONFIG',
        useFactory: async (optionsFactory: subscription.ConfigFactory) =>
          await optionsFactory.createSubscriptionConfig(),
        inject: options.useExisting ? [options.useExisting] : options.inject || [],
      };
    }
    // For useClass
    return {
      provide: 'CONFIG',
      useFactory: async (optionsFactory: subscription.ConfigFactory) => await optionsFactory.createSubscriptionConfig(),
      inject: [options.useClass || ''],
    };
  }
}
