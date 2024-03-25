import { Controller, Post, Req, UseGuards } from '@nestjs/common';

import { AppleGuard, GoogleGuard, StripeGuard } from './guards';
import { SubscriptionService } from './subscription.service';

export interface RequestWithEvent extends Request {
  event: any;
}

@Controller('notify')
export class SubscriptionController {
  constructor(private service: SubscriptionService) {}

  @Post('stripe')
  @UseGuards(StripeGuard)
  async handleStripe(@Req() request: RequestWithEvent) {
    const { event } = request;

    this.service.dispatchEvent('stripe', event.type, event);
  }

  @Post('apple')
  @UseGuards(AppleGuard)
  async handleApplePay(@Req() request: RequestWithEvent) {
    const { event, body } = request;

    this.service.dispatchEvent('apple', event.notificationType, event);
  }

  @Post('google')
  @UseGuards(GoogleGuard)
  async handleGooglePay(@Req() request: RequestWithEvent) {
    const { body, event } = request;
    this.service.dispatchEvent('google', event.type, event);
  }
}
