import { SetMetadata } from '@nestjs/common';

export const ON_EVENT_KEY = 'onSubscriptionEvent';

export interface SubscriptionEventOptions {
  provider: 'apple' | 'google' | 'stripe' | 'all';
  event: string;
}

export function OnSubscriptionEvent(options: SubscriptionEventOptions): MethodDecorator {
  return SetMetadata(ON_EVENT_KEY, options);
}
