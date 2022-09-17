import { NacosNamingClient } from 'nacos';
import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { NamingOptions, Instance, InstanceOption } from './interfaces';
import { NAMING_OPTION } from './constants';

@Injectable()
export class NacosNamingService implements OnModuleInit, OnModuleDestroy {
  private client: NacosNamingClient = null;
  private readonly listeners = new Array<{
    dataId: string;
    group: string;
    listener: (content: string) => void;
  }>();

  constructor(@Inject(NAMING_OPTION) options: NamingOptions) {
    // Config client instance
    const { server: serverList, namespace } = options;
    this.client = new NacosNamingClient({
      serverList,
      namespace,
      logger: console,
    });
  }

  async onModuleInit() {
    await this.client.ready();
  }

  async registerInstance(serviceName: string, instance: InstanceOption, groupName?: string): Promise<void> {
    return this.client.registerInstance(serviceName, instance, groupName);
  }

  async deregisterInstance(serviceName: string, instance: InstanceOption, groupName?: string): Promise<void> {
    return this.client.deregisterInstance(serviceName, instance, groupName);
  }

  /**
   * Query instance list of service.
   * @param serviceName Service name
   * @param groupName group name, default is DEFAULT_GROUP
   * @param clusters Cluster names
   * @param subscribe whether subscribe the service, default is true
   * @returns
   */
  async getAllInstances(
    serviceName: string,
    groupName?: string,
    clusters?: string,
    subscribe?: boolean,
  ): Promise<Instance[] | string[]> {
    // Naocs have an type error for Instance
    return this.client.getAllInstances(serviceName, groupName, clusters, subscribe);
  }

  /**
   * Get the status of nacos server, 'UP' or 'DOWN'.
   * @returns
   */
  async getServerStatus(): Promise<'UP' | 'DOWN'> {
    return this.client.getServerStatus();
  }

  /**
   * Subscribe the instances of the service
   * @param info service info, if type is string, it's the serviceName
   * @param listener the listener function, Naocs have an type error for instances
   * @returns
   */
  async subscribe(
    info: string | { serviceName: string; groupName?: string; clusters?: string },
    listener?: (instances: Instance[] | string[]) => void,
  ): Promise<void> {
    return this.client.subscribe(info, listener);
  }

  /**
   * Unsubscribe the instances of the service
   * @param info service info, if type is string, it's the serviceName
   * @param listener the listener function, if not provide, will unSubscribe all listeners under this service
   * @returns
   */
  async unSubscribe(
    info: string | { serviceName: string; groupName?: string; clusters?: string },
    listener: (instances: Instance[] | string[]) => void,
  ): Promise<void> {
    return this.client.unSubscribe(info, listener);
  }

  async onModuleDestroy() {
    if (this.client) {
      // NacosNamingClient not support close method
      this.client = null;
    }
  }
}
