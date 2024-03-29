import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment-timezone';
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
    const notice: subscription.Notice = { id: `${id}`, type: 'OTHER', original: data, provider: 'Stripe' };

    // case1: SUBSCRIBED OR RENEWED
    if (['invoice.paid'].includes(type)) {
      const type = 'SUBSCRIBED';
      const subscription: subscription.Subscription = this.formatEventByCheckoutSession(data);
      return { ...notice, type, subscription };
    }
    // case2: GRACE_PERIOD
    if (['payment_failed'].includes(type)) {
      const type = 'GRACE_PERIOD';
      // const subscription: subscription.Subscription = this.formatEventByPaymentFailed(data);
      return { ...notice, type };
    }

    // case3: EXPIRED
    if (['customer.subscription.deleted'].includes(type)) {
      const type = 'EXPIRED';
      return { ...notice, type };
    }

    // case4: CANCELLED
    if (['customer.subscription.deleted'].includes(type)) {
      const type = 'CANCELLED';
      // const subscription = this.formatEventByCancelled(data);
      return { ...notice, type };
    }

    // case5: REFUND
    // if (['invoice.payment_failed'].includes(type)) {
    //   return { ...result, type: 'REFUND' };
    // }

    // Other Case
    return notice;
  }

  // Subscribed & Renewed
  private formatEventByCheckoutSession(data: Stripe.Event.Data): subscription.Subscription {
    const { id, subscription, period_start, period_end, lines } = data.object as Stripe.Invoice;
    const { created, account_country } = data.object as Stripe.Invoice;
    const { price } = lines[0];
    return {
      subscription_id: subscription as string,
      period_start: new Date(period_start).toISOString(),
      period_end: new Date(period_end).toISOString(),
      state: 'ACTIVE', // 订阅状态

      transaction: {
        transaction_id: id,
        price_id: price.id,
        region: account_country,
        amount: price.unit_amount,
        currency: price.currency,
        time: new Date(created).toISOString(),
      },
    };
  }

  // Paused
  // private formatEventByPaymentFailed(data: Stripe.Event.Data): subscription.Subscription {
  //   const { subscription, metadata, current_period_start, current_period_end  } = data.object as Stripe.Invoice;
  //   return {
  //     subscriptionId: subscription as string,
  //     startTime: new Date().toISOString(),
  //     expireTime: 0,
  //     // isAutoRenew: 0 | 1, // 是否续订
  //     state: 'PAUSED', // 订阅状态
  //   };
  // }

  // Cancelled
  // private formatEventByCancelled(data: Stripe.Event.Data): subscription.Subscription {
  //   const { id, current_period_start, current_period_end } = data.object as Stripe.Subscription;
  //   return {
  //     subscriptionId: id,
  //     startTime: current_period_start,
  //     expireTime: current_period_end,
  //     state: 'CANCELLED',
  //   };
  // }

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
