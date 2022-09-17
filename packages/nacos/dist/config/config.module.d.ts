import { DynamicModule } from '@nestjs/common';
import { ConfigOptions, ConfigAsyncOptions } from './interfaces';
export declare class NacosConfigModule {
    static forRoot(options: ConfigOptions): DynamicModule;
    static forRootAsync(options: ConfigAsyncOptions): DynamicModule;
}
