import { SetMetadata } from '@nestjs/common';

export const ON_EVENT_KEY = 'onSubscriptionEvent';

export interface SubscriptionEventOptions {
  platform: 'apple' | 'google' | 'stripe' | 'all';
  event: string;
}

export function OnSubscriptionEvent(options: SubscriptionEventOptions): MethodDecorator {
  return SetMetadata(ON_EVENT_KEY, options);
}
