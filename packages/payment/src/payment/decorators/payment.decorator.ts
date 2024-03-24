import { SetMetadata } from '@nestjs/common';

export const ON_PAYMENT_EVENT_KEY = 'onPaymentEvent';

export interface PaymentEventOptions {
  platform: 'apple' | 'google' | 'stripe';
  event: string;
}

export function OnPaymentEvent(options: PaymentEventOptions): MethodDecorator {
  return SetMetadata(ON_PAYMENT_EVENT_KEY, options);
}
