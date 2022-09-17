import { Global, Module, DynamicModule } from '@nestjs/common';
import { NacosNamingService } from './naming.service';
import { NAMING_OPTION } from './constants';
import { NamingOptions, NamingAsyncOptions } from './interfaces';

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
