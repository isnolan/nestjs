// src/payment/payment.controller.ts

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { PaymentDispatcherService } from './dispatcher.service';
import { AppleWebhookGuard, GoogleWebhookGuard, StripeWebhookGuard } from './guards';

@Controller('notify')
export class PaymentController {
  constructor(private eventDispatcher: PaymentDispatcherService) {}

  @Get('stripe')
  async test() {
    return 'success';
  }

  @Post('stripe')
  @UseGuards(StripeWebhookGuard)
  async handleStripe(@Body() body: any) {
    const event = body.type;
    await this.eventDispatcher.dispatchEvent('stripe', event, body);
  }

  @Post('google')
  @UseGuards(GoogleWebhookGuard)
  handleGooglePay(@Body() body: any) {
    // 处理Google Pay事件
  }

  @Post('apple')
  @UseGuards(AppleWebhookGuard)
  handleApplePay(@Body() body: any) {
    // 处理Apple Pay事件
  }
}