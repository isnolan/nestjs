import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeProviderService {
  private stripe: Stripe;

  constructor(@Inject('CONFIG') private readonly config) {
    if (!this.config.stripe) {
      console.warn(`[subscription]stripe, no stripe config, skip stripe provider.`);
      return;
    }
    this.stripe = new Stripe(this.config?.stripe?.apiSecretKey, { apiVersion: '2023-10-16' });
  }

  public async validateWebhookSignature(signature: string, rawBody: string) {
    if (!this.stripe) {
      throw new Error('[subscription]Stripe is not configured.');
    }
    const { webhookSecret } = this.config.stripe;
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  async createSubscriptionCheckouSession(price_id: string, referer: string, user_id?: string, customer_email?: string) {
    const session = await this.stripe.checkout.sessions.create({
      client_reference_id: user_id,
      customer_email,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${referer}/plan?success=true`,
      cancel_url: `${referer}/plan?canceled=true`,
      metadata: { user_id, price_id },
    });

    return session.url;
  }
}
