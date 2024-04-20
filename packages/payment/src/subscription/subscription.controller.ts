import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { AppleGuard, GoogleGuard, StripeGuard } from './guards';
import { SubscriptionService } from './subscription.service';

export interface RequestWithNotice extends Request {
  notice: any;
}

@Controller('notify')
@ApiExcludeController()
export class SubscriptionController {
  constructor(private service: SubscriptionService) {}

  @Post('stripe')
  @UseGuards(StripeGuard)
  async handleStripe(@Req() request: RequestWithNotice) {
    const { notice } = request;
    if (notice.subscription) {
      this.service.dispatchEvent(notice.type, notice.subscription);
    }
    this.service.dispatchOriginalEvent('stripe', notice.original.type, notice.original.data);
  }

  @Post('apple')
  @UseGuards(AppleGuard)
  async handleApplePay(@Req() request: RequestWithNotice) {
    const { notice } = request;
    if (notice.subscription) {
      this.service.dispatchEvent(notice.type, notice.subscription);
    }
    this.service.dispatchOriginalEvent('apple', notice.original.type, notice.original.data);
  }

  @Post('google')
  @UseGuards(GoogleGuard)
  async handleGooglePay(@Req() request: RequestWithNotice) {
    const { notice } = request;
    if (notice?.subscription) {
      this.service.dispatchEvent(notice.type, notice.subscription);
    }
    this.service.dispatchOriginalEvent('google', notice.original.type, notice.original.data);
  }
}
