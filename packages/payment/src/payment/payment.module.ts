import { DynamicModule, Global, Module, Provider } from '@nestjs/common';

import { PaymentConfigFactory, PaymentModuleAsyncOptions, PaymentModuleOptions } from './interface';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Global()
@Module({})
export class PaymentModule {
  static forRoot(config: PaymentModuleOptions): DynamicModule {
    return {
      module: PaymentModule,
      controllers: [PaymentController],
      providers: [{ provide: 'PAYMENT_CONFIG', useValue: config }, PaymentService],
      exports: [PaymentService],
    };
  }

  static forRootAsync(options: PaymentModuleAsyncOptions): DynamicModule {
    return {
      module: PaymentModule,
      imports: options.imports || [],
      controllers: [PaymentController],
      providers: [this.createAsyncProviders(options), PaymentService],
      exports: [PaymentService],
    };
  }

  private static createAsyncProviders(options: PaymentModuleAsyncOptions): Provider {
    if (options.useExisting || options.useFactory) {
      return {
        provide: 'PAYMENT_CONFIG',
        useFactory: async (optionsFactory: PaymentConfigFactory) => await optionsFactory.createPaymentConfig(),
        inject: options.useExisting ? [options.useExisting] : options.inject || [],
      };
    }
    // For useClass
    return {
      provide: 'PAYMENT_CONFIG',
      useFactory: async (optionsFactory: PaymentConfigFactory) => await optionsFactory.createPaymentConfig(),
      inject: [options.useClass || ''],
    };
  }
}
