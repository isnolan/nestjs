import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import fs from 'fs';
import moment from 'moment-timezone';

import { AppleProviderService, GoogleProviderService } from './provider';
import { ON_EVENT_KEY } from './subscription.decorator';
import { subscription } from './types';

@Injectable()
export class SubscriptionService implements OnModuleInit {
  private readonly eventHandlersMap = new Map<string, any[]>();

  constructor(
    private readonly google: GoogleProviderService,
    private readonly apple: AppleProviderService,
    private readonly modulesContainer: ModulesContainer,
  ) {}

  onModuleInit() {
    // 在模块初始化时扫描所有使用 @OnPaymentEvent 的方法，并填充 eventHandlersMap
    const providers = [...this.modulesContainer.values()]
      .map((module) => module.providers)
      .reduce((acc, map) => [...acc, ...map.values()], [] as InstanceWrapper[]);
    providers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      if (!instance) {
        return;
      }
      this.scanFromInstance(instance);
    });
  }

  private scanFromInstance(instance: any) {
    const instancePrototype = Object.getPrototypeOf(instance);
    Object.getOwnPropertyNames(instancePrototype)
      .filter((method) => {
        const descriptor = Object.getOwnPropertyDescriptor(instancePrototype, method);
        return descriptor && typeof descriptor.value === 'function' && method !== 'constructor';
      })
      .forEach((method) => {
        const handler = instance[method];
        const metadata = Reflect.getMetadata(ON_EVENT_KEY, handler);
        if (metadata) {
          const { provider, event } = metadata;
          const key = `${provider.toLowerCase()}:${event.toLowerCase()}`;
          if (!this.eventHandlersMap.has(key)) {
            this.eventHandlersMap.set(key, []);
          }
          this.eventHandlersMap.get(key).push(handler.bind(instance));
        }
      });
  }

  dispatchEvent(provider: string, event: string, data: any) {
    event = event.toLowerCase();
    provider = provider.toLowerCase();
    const specificHandlers = this.eventHandlersMap.get(`${provider}:${event}`) || [];
    const allEventHandlers = this.eventHandlersMap.get('all:all') || [];
    const allPlatformSpecificEventHandlers = this.eventHandlersMap.get(`all:${event}`) || [];
    const providerAllEventHandlers = this.eventHandlersMap.get(`${provider}:all`) || [];

    // 合并所有匹配的处理器
    const handlers = [
      ...specificHandlers,
      ...allPlatformSpecificEventHandlers,
      ...providerAllEventHandlers,
      ...allEventHandlers,
    ];

    handlers.forEach((handler) => handler(data));
  }

  async validateReceipt(provider: string, receipt: string): Promise<subscription.Subscription> {
    const time = moment().tz('Asia/Shanghai').format('YYMMDDHHmmssSSS');
    let notice: subscription.Subscription;
    if (provider === 'apple') {
      notice = await this.apple.validateReceipt(receipt);
    }

    if (provider === 'google') {
      notice = await this.google.validateReceipt(receipt);
    }

    !fs.existsSync('./notify') && fs.mkdirSync('./notify');
    fs.writeFileSync(`./notify/${time}_${provider}.json`, JSON.stringify({ receipt, notice }, null, 2));

    throw new Error(`Unsupported provider: ${provider}`);
  }
}
