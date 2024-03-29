import { Controller, Post, Req, UseGuards } from '@nestjs/common';

import { AppleGuard, GoogleGuard, StripeGuard } from './guards';
import { SubscriptionService } from './subscription.service';

export interface RequestWithNotice extends Request {
  notice: any;
}

@Controller('notify')
export class SubscriptionController {
  constructor(private service: SubscriptionService) {}

  @Post('stripe')
  @UseGuards(StripeGuard)
  async handleStripe(@Req() request: RequestWithNotice) {
    const { notice } = request;
    this.service.dispatchEvent('Stripe', notice.type, notice);
  }

  @Post('apple')
  @UseGuards(AppleGuard)
  async handleApplePay(@Req() request: RequestWithNotice) {
    const { notice } = request;
    this.service.dispatchEvent('Apple', notice.type, notice);
  }

  @Post('google')
  @UseGuards(GoogleGuard)
  async handleGooglePay(@Req() request: RequestWithNotice) {
    const { notice } = request;
    this.service.dispatchEvent('Google', notice.type, notice);
  }
}
