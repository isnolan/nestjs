import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { NamingOptions, Instance, InstanceOption } from './interfaces';
export declare class NacosNamingService implements OnModuleInit, OnModuleDestroy {
    private client;
    private readonly listeners;
    constructor(options: NamingOptions);
    onModuleInit(): Promise<void>;
    registerInstance(serviceName: string, instance: InstanceOption, groupName?: string): Promise<void>;
    deregisterInstance(serviceName: string, instance: InstanceOption, groupName?: string): Promise<void>;
    /**
     * Query instance list of service.
     * @param serviceName Service name
     * @param groupName group name, default is DEFAULT_GROUP
     * @param clusters Cluster names
     * @param subscribe whether subscribe the service, default is true
     * @returns
     */
    getAllInstances(serviceName: string, groupName?: string, clusters?: string, subscribe?: boolean): Promise<Instance[] | string[]>;
    /**
     * Get the status of nacos server, 'UP' or 'DOWN'.
     * @returns
     */
    getServerStatus(): Promise<'UP' | 'DOWN'>;
    /**
     * Subscribe the instances of the service
     * @param info service info, if type is string, it's the serviceName
     * @param listener the listener function, Naocs have an type error for instances
     * @returns
     */
    subscribe(info: string | {
        serviceName: string;
        groupName?: string;
        clusters?: string;
    }, listener?: (instances: Instance[] | string[]) => void): Promise<void>;
    /**
     * Unsubscribe the instances of the service
     * @param info service info, if type is string, it's the serviceName
     * @param listener the listener function, if not provide, will unSubscribe all listeners under this service
     * @returns
     */
    unSubscribe(info: string | {
        serviceName: string;
        groupName?: string;
        clusters?: string;
    }, listener: (instances: Instance[] | string[]) => void): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
