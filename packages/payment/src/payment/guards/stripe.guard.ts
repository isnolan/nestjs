import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookGuard implements CanActivate {
  private stripe: Stripe;

  constructor(
    @Inject('PAYMENT_CONFIG')
    private readonly config,
  ) {
    this.stripe = new Stripe(this.config?.stripe?.apiSecretKey, { apiVersion: '2023-10-16' });
  }

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];

    // 从环境变量获取Stripe Webhook Secret
    const { webhookSecret } = this.config?.stripe;

    if (!signature || !webhookSecret) {
      throw new UnauthorizedException('Missing Stripe signature or webhook secret.');
    }

    try {
      // 使用Stripe库来构建事件，这将验证签名
      const rawBody = request[this.config.rawBodyKey || 'rawBody'];
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

      // 将验证后的事件附加到request对象，以便后续使用
      (request as any).event = event;

      return true;
    } catch (err) {
      throw new UnauthorizedException(`Stripe webhook error: ${err.message}`);
    }
  }
}
