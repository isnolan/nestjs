import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { StripeProviderService } from '../provider';
import { BaseGuard } from './apple.guard';

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
      const notice = await this.provider.validateWebhookSignature(signature, rawBody);
      (request as any).notice = notice;
      this.save('stripe', notice);
      return true;
    } catch (err) {
      this.save('stripe', { error: err.message });
      throw new UnauthorizedException(`Stripe webhook error: ${err.message}`);
    }
  }
}
