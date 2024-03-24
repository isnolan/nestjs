import { OnPaymentEvent } from '@isnolan/nestjs-payment';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // @OnPaymentEvent({ platform: 'all', event: 'all' })
  // @OnPaymentEvent({ platform: 'all', event: 'invoice.paid' })
  @OnPaymentEvent({ platform: 'stripe', event: 'invoice.paid' })
  handleStripePaymentSuccess(data: any) {
    console.log(`[stripe]`, data);
  }
}
