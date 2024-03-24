import { DynamicModule, Global, Module } from '@nestjs/common';

import { NacosConfigService } from './config.service';
import { CONFIG_OPTION } from './constants';
import { ConfigAsyncOptions, ConfigOptions } from './interfaces';

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
