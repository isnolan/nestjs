import { AppleProviderService } from './apple.provider';
import { GoogleProviderService } from './google.provider';
import { StripeProviderService } from './stripe.provider';

export * from './apple.provider';
export * from './google.provider';
export * from './stripe.provider';

export default [AppleProviderService, GoogleProviderService, StripeProviderService];
