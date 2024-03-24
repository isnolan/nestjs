import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { AppleWebhookGuard, GoogleWebhookGuard, StripeWebhookGuard } from './guards';
import { PaymentService } from './payment.service';

export interface RequestWithEvent extends Request {
  event: any;
}

@Controller('notify')
export class PaymentController {
  constructor(private service: PaymentService) {}

  @Post('stripe')
  @UseGuards(StripeWebhookGuard)
  async handleStripe(@Req() request: RequestWithEvent) {
    const { event } = request;
    await this.service.dispatchEvent('stripe', event.type, event);
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
