import { DynamicModule, Global, Module, Provider } from '@nestjs/common';

import { SubscriptionConfigFactory, SubscriptionModuleAsyncOptions, SubscriptionModuleOptions } from './interface';
import Providers from './provider';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Global()
@Module({})
export class SubscriptionModule {
  static forRoot(config: SubscriptionModuleOptions): DynamicModule {
    return {
      module: SubscriptionModule,
      controllers: [SubscriptionController],
      providers: [{ provide: 'PAYMENT_CONFIG', useValue: config }, SubscriptionService, ...Providers],
      exports: [SubscriptionService],
    };
  }

  static forRootAsync(options: SubscriptionModuleAsyncOptions): DynamicModule {
    return {
      module: SubscriptionModule,
      imports: options.imports || [],
      controllers: [SubscriptionController],
      providers: [this.createAsyncProviders(options), SubscriptionService, ...Providers],
      exports: [SubscriptionService],
    };
  }

  private static createAsyncProviders(options: SubscriptionModuleAsyncOptions): Provider {
    if (options.useExisting || options.useFactory) {
      return {
        provide: 'PAYMENT_CONFIG',
        useFactory: async (optionsFactory: SubscriptionConfigFactory) =>
          await optionsFactory.createSubscriptionConfig(),
        inject: options.useExisting ? [options.useExisting] : options.inject || [],
      };
    }
    // For useClass
    return {
      provide: 'PAYMENT_CONFIG',
      useFactory: async (optionsFactory: SubscriptionConfigFactory) => await optionsFactory.createSubscriptionConfig(),
      inject: [options.useClass || ''],
    };
  }
}
