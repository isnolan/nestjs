import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import fs from 'fs';
import moment from 'moment-timezone';

import { AppleProviderService, GoogleProviderService } from './provider';
import { ON_EVENT_KEY, ON_ORIGINAL_EVENT_KEY } from './subscription.decorator';
import { subscription } from './types';

@Injectable()
export class SubscriptionService implements OnModuleInit {
  private readonly eventHandlersMap = new Map<string, any[]>();
  private readonly originalHandlersMap = new Map<string, any[]>();

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
        // unified event
        const metadata = Reflect.getMetadata(ON_EVENT_KEY, handler);
        if (metadata) {
          const { event } = metadata;
          const key = `${event.toLowerCase()}`;
          if (!this.eventHandlersMap.has(key)) {
            this.eventHandlersMap.set(key, []);
          }
          this.eventHandlersMap.get(key).push(handler.bind(instance));
        }

        // original event
        const originalMetadata = Reflect.getMetadata(ON_ORIGINAL_EVENT_KEY, handler);
        if (originalMetadata) {
          const { provider, event } = originalMetadata;
          const key = `${provider.toLowerCase()}:${event.toLowerCase()}`;
          if (!this.originalHandlersMap.has(key)) {
            this.originalHandlersMap.set(key, []);
          }
          this.originalHandlersMap.get(key).push(handler.bind(instance));
        }
      });
  }

  dispatchEvent(event: string, data: any) {
    event = event.toLowerCase();
    const specificHandlers = this.eventHandlersMap.get(event) || []; // 指定事件
    const allEventHandlers = this.eventHandlersMap.get('all') || []; // 所有事件

    // 合并所有匹配的处理器
    const handlers = [...specificHandlers, ...allEventHandlers];
    handlers.forEach((handler) => handler(data));
  }

  dispatchOriginalEvent(provider: string, event: string, data: any) {
    event = event.toLowerCase();
    provider = provider.toLowerCase();
    const specificHandlers = this.originalHandlersMap.get(`${provider}:${event}`) || []; // 指定平台指定事件
    const allEventHandlers = this.originalHandlersMap.get('all:all') || []; // 所有平台所有事件
    const allPlatformSpecificEventHandlers = this.originalHandlersMap.get(`all:${event}`) || []; // 所有平台指定事件
    const providerAllEventHandlers = this.originalHandlersMap.get(`${provider}:all`) || []; // 指定平台所有事件

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
    } else if (provider === 'google') {
      notice = await this.google.validateReceipt(receipt);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    !fs.existsSync('./notify') && fs.mkdirSync('./notify');
    fs.writeFileSync(`./notify/${time}_${provider}.json`, JSON.stringify({ receipt, notice }, null, 2));

    // throw new Error(`Unsupported provider: ${provider}`);
    return notice;
  }
}
