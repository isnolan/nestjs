import { Global, Module, DynamicModule } from '@nestjs/common';
import { NacosConfigService } from './config.service';
import { CONFIG_OPTION } from './constants';
import { ConfigOptions, ConfigAsyncOptions } from './interfaces';

@Global()
@Module({})
export class NacosConfigModule {
  static forRoot(options: ConfigOptions): DynamicModule {
    return {
      module: NacosConfigModule,
      providers: [
        {
          provide: CONFIG_OPTION,
          useValue: options,
        },
        NacosConfigService,
      ],
      exports: [NacosConfigService],
    };
  }

  static forRootAsync(options: ConfigAsyncOptions): DynamicModule {
    return {
      module: NacosConfigModule,
      providers: [
        {
          provide: CONFIG_OPTION,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        NacosConfigService,
      ],
      exports: [NacosConfigService],
    };
  }
}
