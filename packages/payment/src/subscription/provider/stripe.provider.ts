import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

import type { stripe, subscription } from '../types';

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

  public validateWebhookSignature(signature: string, rawBody: string): subscription.Notice {
    if (!this.stripe) {
      throw new Error('[subscription]Stripe is not configured.');
    }

    const { webhookSecret } = this.config.stripe;
    const { type, id, data } = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    const notice: subscription.Notice = { id: id, type: 'UNHANDLED', original: { type, data }, provider: 'Stripe' };

    // case1: SUBSCRIBED OR RENEWED
    if (['invoice.paid'].includes(type)) {
      return this.formatEventByPaid(notice, data);
    }

    // case2: GRACE_PERIOD
    if (['payment_failed'].includes(type)) {
      const type = 'GRACE_PERIOD';
      const subscription = this.formatEventByPaymentFailed(data);
      return { ...notice, type, subscription };
    }

    // case3: Cancel, at period end
    if (['customer.subscription.updated'].includes(type)) {
      const subscription = this.formatEventByCancel(data);
      if (subscription) {
        return { ...notice, type: 'CANCELLED', subscription };
      }
    }

    // case4: Cancel, at now
    if (['customer.subscription.deleted'].includes(type)) {
      const subscription = this.formatEventByCancel(data, true);
      return { ...notice, type: 'CANCELLED', subscription };
    }

    // Other Case
    return notice;
  }

  // Subscribed & Renewed
  private formatEventByPaid(notice: subscription.Notice, data: Stripe.Event.Data): subscription.Notice {
    const { id, subscription: sub_id, period_start, period_end, lines } = data.object as Stripe.Invoice;
    const { number, created, account_country } = data.object as Stripe.Invoice;
    const { price } = lines.data[0];

    const subscription = {
      subscription_id: sub_id as string,
      period_start: new Date(period_start * 1000).toISOString(),
      period_end: new Date(period_end * 1000).toISOString(),
      state: 'Active' as subscription.State,

      transaction: {
        transaction_id: id,
        price_id: price.id,
        region: account_country,
        amount: price.unit_amount,
        currency: price.currency.toUpperCase(),
        time_at: new Date(created * 1000).toISOString(),
      },
    };

    const type = number.endsWith('0001') ? 'SUBSCRIBED' : 'RENEWED';
    return { ...notice, type, subscription };
  }

  // Paused
  private formatEventByPaymentFailed(data: Stripe.Event.Data): subscription.Subscription {
    const { subscription: sub_id, period_start, period_end } = data.object as Stripe.Invoice;

    return {
      subscription_id: sub_id as string,
      period_start: new Date(period_start * 1000).toISOString(),
      period_end: new Date(period_end * 1000).toISOString(),
      state: 'Paused' as subscription.State,
    };
  }

  // Cancelled
  private formatEventByCancel(data: Stripe.Event.Data, immediate = false): subscription.Subscription | undefined {
    const { id, canceled_at, cancellation_details, current_period_start } = data.object as Stripe.Subscription;
    let { current_period_end } = data.object as Stripe.Subscription;
    if (canceled_at) {
      if (immediate) {
        current_period_end = canceled_at;
      }

      return {
        subscription_id: id,
        period_start: new Date(current_period_start * 1000).toISOString(),
        period_end: new Date(current_period_end * 1000).toISOString(),
        state: immediate ? 'Cancelled' : 'Active',

        cancellation: {
          reason: cancellation_details.reason,
          time_at: new Date(canceled_at * 1000).toISOString(),
        },
      };
    }
    return;
  }

  // Expired
  private formatEventBySubDeleted(data: Stripe.Event.Data): subscription.Subscription {
    const { id, current_period_start, current_period_end } = data.object as Stripe.Subscription;
    return {
      subscription_id: id,
      period_start: new Date(current_period_start * 1000).toISOString(),
      period_end: new Date(current_period_end * 1000).toISOString(),
      state: 'Expired' as subscription.State,
    };
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
