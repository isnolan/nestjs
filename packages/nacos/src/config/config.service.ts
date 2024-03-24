import { Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { NacosConfigClient } from 'nacos';
import { propertiesToJson } from 'properties-file/content';
import { parse as yamlToJson } from 'yaml';

import { CONFIG_METAKEY, CONFIG_OPTION, ConfigType } from './constants';
import { ConfigOptions } from './interfaces';

export class NacosConfigService implements OnModuleInit, OnModuleDestroy {
  private client: NacosConfigClient = null;
  private readonly listeners = new Array<{
    dataId: string;
    group: string;
    listener: (content: string) => void;
  }>();

  constructor(@Inject(CONFIG_OPTION) options: ConfigOptions, private readonly container: ModulesContainer) {
    // Config client instance
    const { server: serverAddr, namespace } = options;
    this.client = new NacosConfigClient({ serverAddr, namespace });
  }

  /**
   * 模块初始化
   */
  async onModuleInit() {
    // 搜索所有应用装饰器的模块
    await this.scanProviderPropertyMetadates(
      CONFIG_METAKEY,
      async (instance, propertyKey, { dataId, group, format }) => {
        // 将搜索到有元数据的实例，添加进入监听者数组
        this.listeners.push({
          dataId,
          group,
          listener: async (content: string) => {
            let config: string | object;
            try {
              // 解析配置，转化为JSON类型
              switch (format) {
                case ConfigType.JSON:
                  config = JSON.parse(content);
                  break;
                case ConfigType.YAML:
                  config = yamlToJson(content);
                  break;
                case ConfigType.PROPERTIES:
                  config = propertiesToJson(content);
                  break;
                default: // 其它类型不做解析
                  config = content;
                  break;
              }
            } catch (err) {
              console.error(`Parsing failed! group:${group} dataId:${dataId}`);
            }

            instance[propertyKey] = config;
          },
        });
      },
    );

    // 监听所有配置变更
    for (const { dataId, group, listener } of this.listeners) {
      this.client.subscribe({ dataId, group }, listener);
      console.log(`Subscribed! group: ${group} dataId: ${dataId}`);
    }
  }

  async scanProviderPropertyMetadates(
    metaKey: string,
    cb: (instance: object, propertyKey: string, metaData: any) => any,
  ) {
    await this.scanProvider(async (instance) => {
      for (const propertyKey in instance) {
        const metaData = Reflect.getMetadata(metaKey, instance, propertyKey);
        if (metaData) {
          await cb(instance, propertyKey, metaData);
        }
      }
    });
  }

  async scanProvider(cb: (instance: object) => any) {
    const instances: any[] = [];

    this.container.forEach(({ providers }) => {
      providers.forEach(({ instance }) => {
        if (instance && typeof instance === 'object') {
          instances.push(instance);
        }
      });
    });

    for (const instance of instances) {
      await cb(instance);
    }
  }

  /**
   * 模块销毁
   */
  async onModuleDestroy() {
    for (const { dataId, group, listener } of this.listeners) {
      this.client.unSubscribe({ dataId, group }, listener);
    }

    this.listeners.length = 0;
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}
