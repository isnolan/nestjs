import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { StripeProviderService } from '../provider';

@Injectable()
export class StripeGuard implements CanActivate {
  constructor(
    @Inject('PAYMENT_CONFIG')
    private readonly config,
    private readonly provider: StripeProviderService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];

    try {
      const rawBody = request[this.config.rawBodyKey || 'rawBody'];
      const event = this.provider.validateWebhookSignature(signature, rawBody);
      (request as any).event = event;
      return true;
    } catch (err) {
      throw new UnauthorizedException(`Stripe webhook error: ${err.message}`);
    }
  }
}
