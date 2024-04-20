import { SetMetadata } from '@nestjs/common';

export const ON_EVENT_KEY = 'onSubscriptionEvent';
export const ON_ORIGINAL_EVENT_KEY = 'onSubscriptionOriginalEvent';

export interface SubscriptionEventOptions {
  event: string;
}

export interface SubscriptionOriginalEventOptions {
  provider: 'apple' | 'google' | 'stripe';
  event: string;
}

export function OnSubscriptionEvent(options: SubscriptionEventOptions): MethodDecorator {
  return SetMetadata(ON_EVENT_KEY, options);
}

export function OnSubscriptionOriginalEvent(options: SubscriptionOriginalEventOptions): MethodDecorator {
  return SetMetadata(ON_ORIGINAL_EVENT_KEY, options);
}
