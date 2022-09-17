import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { ConfigOptions } from './interfaces';
export declare class NacosConfigService implements OnModuleInit, OnModuleDestroy {
    private readonly container;
    private client;
    private readonly listeners;
    constructor(options: ConfigOptions, container: ModulesContainer);
    /**
     * 模块初始化
     */
    onModuleInit(): Promise<void>;
    scanProviderPropertyMetadates(metaKey: string, cb: (instance: object, propertyKey: string, metaData: any) => any): Promise<void>;
    scanProvider(cb: (instance: object) => any): Promise<void>;
    /**
     * 模块销毁
     */
    onModuleDestroy(): Promise<void>;
}
