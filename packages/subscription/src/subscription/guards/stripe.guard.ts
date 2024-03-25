import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { StripeProviderService } from '../provider';
import { BaseGuard } from './base.guard';

@Injectable()
export class StripeGuard extends BaseGuard implements CanActivate {
  constructor(
    @Inject('CONFIG')
    private readonly config,
    private readonly provider: StripeProviderService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];
    const rawBody = request[this.config.rawBodyKey || 'rawBody'];

    try {
      const event = await this.provider.validateWebhookSignature(signature, rawBody);
      (request as any).event = event;
      this.save('stripe', rawBody, event);
      return true;
    } catch (err) {
      this.save('stripe', rawBody, { error: err.message });
      throw new UnauthorizedException(`Stripe webhook error: ${err.message}`);
    }
  }
}
