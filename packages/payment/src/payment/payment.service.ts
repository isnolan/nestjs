// src/payment/payment.service.ts

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { ModulesContainer } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class PaymentService implements OnModuleInit, OnModuleDestroy {
  // constructor(private readonly container: ModulesContainer) {
  //   console.log(`->`, container, this.container);
  // }

  async onModuleInit() {
    //
  }

  async processEvent(req: Request, body: any, headers: any): Promise<any> {
    const platform = this.identifyPlatform(req, headers);
    const eventType = this.extractEventType(platform, body, headers);
    // 分发事件
    this.dispatchEvent(platform, eventType, body);
  }

  private identifyPlatform(req: Request, headers: any): string {
    // 实现逻辑来确定事件来自哪个支付平台
    return '';
  }

  private extractEventType(platform: string, body: any, headers: any): string {
    // 根据平台不同，提取事件类型
    return '';
  }

  private dispatchEvent(platform: string, eventType: string, data: any) {
    // 实现事件分发逻辑
  }

  async onModuleDestroy() {
    //
  }
}
