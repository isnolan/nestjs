import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import { ON_PAYMENT_EVENT_KEY } from './decorators/payment.decorator';

@Injectable()
export class PaymentService implements OnModuleInit, OnModuleDestroy {
  private readonly eventHandlersMap = new Map<string, any[]>();

  constructor(private readonly modulesContainer: ModulesContainer) {}

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
        const metadata = Reflect.getMetadata(ON_PAYMENT_EVENT_KEY, handler);
        if (metadata) {
          const { platform, event } = metadata;
          const key = `${platform}:${event}`;
          if (!this.eventHandlersMap.has(key)) {
            this.eventHandlersMap.set(key, []);
          }
          this.eventHandlersMap.get(key).push(handler.bind(instance));
        }
      });
  }

  dispatchEvent(platform: string, event: string, data: any) {
    const specificHandlers = this.eventHandlersMap.get(`${platform}:${event}`) || [];
    const allEventHandlers = this.eventHandlersMap.get('all:all') || [];
    const allPlatformSpecificEventHandlers = this.eventHandlersMap.get(`all:${event}`) || [];
    const platformAllEventHandlers = this.eventHandlersMap.get(`${platform}:all`) || [];

    // 合并所有匹配的处理器
    const handlers = [
      ...specificHandlers,
      ...allPlatformSpecificEventHandlers,
      ...platformAllEventHandlers,
      ...allEventHandlers,
    ];

    handlers.forEach((handler) => handler(data));
  }

  async onModuleDestroy() {
    //
  }
}
