import { OnSubscriptionEvent, StripeProviderService } from '@isnolan/nestjs-subscription';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly stripe: StripeProviderService) {}
  // @OnSubscriptionEvent({ platform: 'all', event: 'all' })
  // @OnSubscriptionEvent({ platform: 'all', event: 'invoice.paid' })
  @OnSubscriptionEvent({ platform: 'stripe', event: 'all' })
  handleStripeSubsriptionSuccess(data: any) {
    console.log(`[stripe]`, data);
  }

  @OnSubscriptionEvent({ platform: 'apple', event: 'all' })
  handleAppleSubsriptionSuccess(data: any) {
    console.log(`[apple]`, data);
  }

  @OnSubscriptionEvent({ platform: 'google', event: 'all' })
  handleGoogleSubsriptionSuccess(data: any) {
    // 返回统一数据、原始数据
    console.log(`[google]`, data);
  }

  async validateReceipt(platform: string, receipt: any) {
    // validate receipt by google & apple pay
    console.log(`[receipt]`, platform, receipt);
  }
}
