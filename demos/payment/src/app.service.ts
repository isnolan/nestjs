import { OnSubscriptionEvent, StripeProviderService } from '@isnolan/nestjs-payment';
import { subscription } from '@isnolan/nestjs-payment';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly stripe: StripeProviderService) {}
  // All platform event
  @OnSubscriptionEvent({ platform: 'all', event: 'RENEWED' })
  handleALLEventSuccess(data: subscription.Subscription) {
    console.log(`[all]all:`, data);
  }

  // Unified events for all platforms
  // @OnSubscriptionEvent({ platform: 'all', event: 'RENEWED' }) //
  // handleStripeSubsriptionSuccess(data: any) {
  //   console.log(`[all]RENEWED:`, data);
  // }

  // // Original events of the specified platform
  // @OnSubscriptionEvent({ platform: 'all', event: 'invoice.paid' }) // origin event
  // handleStripeOriginEventSuccess(data: any) {
  //   console.log(`[all]invoice.paid:`, data);
  // }

  // // All events on the specified platform
  // @OnSubscriptionEvent({ platform: 'apple', event: 'all' })
  // handleAppleSubsriptionSuccess(data: any) {
  //   console.log(`[apple]all:`, data);
  // }
}
