import { OnSubscriptionEvent } from '@isnolan/nestjs-subscription';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // @OnSubscriptionEvent({ platform: 'all', event: 'all' })
  // @OnSubscriptionEvent({ platform: 'all', event: 'invoice.paid' })
  @OnSubscriptionEvent({ platform: 'stripe', event: 'invoice.paid' })
  handleStripePaymentSuccess(data: any) {
    console.log(`[stripe]`, data);
  }

  @OnSubscriptionEvent({ platform: 'apple', event: 'all' })
  handleApplePaymentSuccess(data: any) {
    console.log(`[apple]`, data);
  }
}
