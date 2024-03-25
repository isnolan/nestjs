import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

import type { stripe } from '../types';

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

  async createCheckouSession(opts: stripe.createCheckouDto) {
    const { mode = 'subscription', price_id, user_id, email, success_url, cancel_url } = opts;
    return this.stripe.checkout.sessions.create({
      mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      client_reference_id: user_id,
      customer_email: email,
      success_url,
      cancel_url,
      metadata: { user_id, price_id },
    });
  }
}
