import { DynamicModule, Global, Module } from '@nestjs/common';

import { NAMING_OPTION } from './constants';
import { NamingAsyncOptions, NamingOptions } from './interfaces';
import { NacosNamingService } from './naming.service';

@Global()
@Module({})
export class NacosNamingModule {
  static forRoot(options: NamingOptions): DynamicModule {
    return {
      module: NacosNamingModule,
      providers: [
        {
          provide: NAMING_OPTION,
          useValue: options,
        },
        NacosNamingService,
      ],
      exports: [NacosNamingService],
    };
  }

  static forRootAsync(options: NamingAsyncOptions): DynamicModule {
    return {
      module: NacosNamingModule,
      providers: [
        {
          provide: NAMING_OPTION,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        NacosNamingService,
      ],
      exports: [NacosNamingService],
    };
  }
}
