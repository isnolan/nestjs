import { Controller, Post, Req, UseGuards } from '@nestjs/common';

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
  async handleGooglePay(@Req() request: RequestWithEvent) {
    const { event } = request;
    await this.service.dispatchEvent('google', event.type, event);
  }

  @Post('apple')
  @UseGuards(AppleWebhookGuard)
  async handleApplePay(@Req() request: RequestWithEvent) {
    const { event } = request;
    await this.service.dispatchEvent('apple', event.type, event);
  }
}
