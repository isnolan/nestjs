import { DynamicModule } from '@nestjs/common';
import { NamingOptions, NamingAsyncOptions } from './interfaces';
export declare class NacosNamingModule {
    static forRoot(options: NamingOptions): DynamicModule;
    static forRootAsync(options: NamingAsyncOptions): DynamicModule;
}
