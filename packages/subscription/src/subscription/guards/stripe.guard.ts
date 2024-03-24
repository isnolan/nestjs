import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeGuard implements CanActivate {
  private stripe: Stripe;

  constructor(
    @Inject('PAYMENT_CONFIG')
    private readonly config,
  ) {
    if (!this.config.stripe) {
      return;
    }

    this.stripe = new Stripe(this.config?.stripe?.apiSecretKey, { apiVersion: '2023-10-16' });
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.stripe) {
      throw new UnauthorizedException('Stripe is not configured.');
    }

    const request: Request = context.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];
    const { webhookSecret } = this.config?.stripe;

    if (!signature || !webhookSecret) {
      throw new UnauthorizedException('Missing Stripe signature or webhook secret.');
    }

    try {
      const rawBody = request[this.config.rawBodyKey || 'rawBody'];
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      (request as any).event = event;
      return true;
    } catch (err) {
      throw new UnauthorizedException(`Stripe webhook error: ${err.message}`);
    }
  }
}
