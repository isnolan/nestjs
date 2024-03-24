import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeProviderService {
  private stripe: Stripe;

  constructor(
    @Inject('PAYMENT_CONFIG')
    private readonly config,
  ) {
    if (!this.config.stripe) {
      console.warn(`[subscription]stripe, no stripe config, skip stripe provider.`);
      return;
    }
    this.stripe = new Stripe(this.config?.stripe?.apiSecretKey, { apiVersion: '2023-10-16' });
  }

  async validateWebhookSignature(signature: string, rawBody: string) {
    if (!this.stripe) {
      throw new Error('[subscription]Stripe is not configured.');
    }
    const { webhookSecret } = this.config.stripe;
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}
