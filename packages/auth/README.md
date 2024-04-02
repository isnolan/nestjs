# Payment Module for NestJS

`SubscriptionModule` is a powerful NestJS module designed to streamline subscription management by providing seamless integration with popular payment platforms such as Stripe, Google Pay, and Apple Pay. It simplifies the handling of subscription events via webhooks, offering a unified solution for verifying and processing payment notifications securely.

<p>
  <a href="https://www.npmjs.com/package/@isnolan/nestjs-payment" > 
    <img src="https://img.shields.io/npm/v/@isnolan/nestjs-payment.svg?style=flat" alt="version"  />
  </a>

  <a href="https://www.npmjs.com/package/@isnolan/nestjs-payment">
    <img alt="downloads" src="https://img.shields.io/npm/dt/@isnolan/nestjs-payment.svg?style=flat" />
  </a>

  <img alt="license" src="https://img.shields.io/npm/l/@isnolan/nestjs-payment.svg" />
</p>

## Features

- Effortless integration with Stripe, Google Pay, and Apple Pay.
- Secure validation and processing of payment webhooks.
- Flexible event handling for various payment events.
- Supports both synchronous and asynchronous configurations.


## Getting Started

### Installation

#### PNPM
Using PNPM
Install the package along with the Stripe peer dependency:
```sh
`pnpm install --save @isnolan/nestjs-payment`
```

### Import

#### Asynchronous configuration
Synchronous Configuration
To utilize SubscriptionModule, import and add it to the imports array of your NestJS module, typically AppModule. Here's a synchronous configuration example:
#### Synchronous configuration
```ts
import { SubscriptionModule } from '@isnolan/nestjs-payment';

@Module({
  imports: [
    SubscriptionModule.forRoot({
      stripe: {
        apiSecretKey: `${process.env.STRIPE_SECRET_KEY}`,
        webhookSecret: `${process.env.STRIPE_SECRET_WEBHOOK}`,
      },
      apple: {
        signingKey: `${process.env.APPLE_SIGNING_KEY}`,
        keyId: `${process.env.APPLE_KEY_ID}`,
        issuerId: `${process.env.APPLE_ISSUER_ID}`,
        bundleId: `${process.env.APPLE_BUNDLE_ID}`,
        environment: 'Sandbox',
      },
    }),
  ],
  providers: [AppService],
})
export class AppModule {}

```

#### Asynchronous configuration
Asynchronous Configuration
SubscriptionModule also supports asynchronous configuration, useful for determining configurations dynamically at runtime:
```typescript

import { SubscriptionModule } from '@isnolan/nestjs-payment';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SubscriptionModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => config.get('subscription'),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}

```


### Configure Webhooks 
The webhook URLs are as follows:

#### Appple 
> https://api.xxxx.com/v1/notify/apple

Follow the instructions from the [App Store Documentation](https://developer.apple.com/documentation/appstoreservernotifications/enabling_app_store_server_notifications) for remaining integration steps such as testing your integration with the CLI before you go live and properly configuring the endpoint from the Stripe dashboard so that the correct events are sent to your NestJS app.

#### Google
> https://api.xxxx.com/v1/notify/google

Follow the instructions from the [Google Play Documentation](https://medium.com/@jmn8718/in-app-purchases-notifications-4408c3ee88eb) for remaining integration steps such as testing your integration with the CLI before you go live and properly configuring the endpoint from the Stripe dashboard so that the correct events are sent to your NestJS app.


#### Stripe
> https://api.xxxx.com/v1/notify/stripe

Follow the instructions from the [Stripe Documentation](https://stripe.com/docs/webhooks) for remaining integration steps such as testing your integration with the CLI before you go live and properly configuring the endpoint from the Stripe dashboard so that the correct events are sent to your NestJS app.


## Subscription lifetcycle
It will be very complicated to connect the subscription interfaces and webhooks of Google Play, App Store, and Stripe at the same time, and we will have to spend more time to unify the interfaces. In order to simplify development, we abstracted and aggregated the events of three of them and defined our key events and state here:

### Event
| Event          | Description               |
|----------------|---------------------------|
| SUBSCRIBED     | Indicates that the user has created a new subscription, including re-subscription after cancellation. |
| RENEWED        | Indicates that the user's active subscription has entered a new cycle through renewal. |
| GRACE_PERIOD   | Indicates a grace period where the subscription is still considered active but payment has not been received yet. This typically occurs after a payment failure or during a trial period extension. |
| EXPIRED        | Indicates that the subscription has reached its expiration date and is no longer active. |
| CANCELLED      | Indicates that the user has voluntarily cancelled their subscription. |
| UNHANDLED      | Indicates an event that hasn't been processed or recognized by the module. |

### State
| State          | Description              | 
|----------------|--------------------------|
| Active         | Represents the active state of a subscription, indicating that the user has access to the subscribed services or content. |
| Paused         | Indicates that the subscription is temporarily paused, during which the user may not have access to the subscribed services or content but retains their subscription benefits. |
| Expired         | Represents the state where the subscription has reached its expiration date and is no longer active. |
| Cancelled       | Indicates that the subscription has been cancelled, either by the user or due to non-payment, and access to the subscribed services or content has been revoked. |

#### Subscribed event
```typescript
import { OnSubscriptionEvent, StripeProviderService } from '@isnolan/nestjs-payment';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly stripe: StripeProviderService) {}
  // All provider event
  @OnSubscriptionEvent({ provider: 'all', event: 'all' }) 
  handleALLEventSuccess(data: any) {
    console.log(`[all]all:`, data);
  }

  // Unified events for all provider
  @OnSubscriptionEvent({ provider: 'all', event: 'RENEWED' }) // 
  handleStripeSubsriptionSuccess(data: any) {
    console.log(`[all]RENEWED:`, data);
  }

  // Original events of the specified provider 
  @OnSubscriptionEvent({ provider: 'all', event: 'invoice.paid' }) // origin event
  handleStripeOriginEventSuccess(data: any) {
    console.log(`[all]invoice.paid:`, data);
  }

  // All events on the specified provider
  @OnSubscriptionEvent({ provider: 'apple', event: 'all' })
  handleAppleSubsriptionSuccess(data: any) {
    console.log(`[apple]all:`, data);
  }
}

```

#### Valdate App(Google Play & Apple Store) receipt 
```typescript
import {SubscriptionService } from '@isnolan/nestjs-payment';

@Injectable()
export class AppService {
    constructor(
    private readonly subscription: SubscriptionService,
  ) {}

  @Post('receipt')
  async validateReceipt(@Body() payload: ValidateReceiptDto) {
    const { platform, purchase_token } = payload;
    const subscription = await this.subscription.validateReceipt(platform, purchase_token);
    console.log(`[purchase]receipt`, subscription);
  }
}

```

## About Best Partice
### Product Id
In order to comply with the general rules of Stripe, Google Play, and Apple Play. You may have to store two sets of purchased product IDs in your business database and use the corresponding IDs in Mobile and Web.

  This is because:
1. Stripe subscription will automatically create a Price ID. (corresponding to your Product ID), which is case-sensitive.
2. Apple Store & Google Play will require you to specify the Product ID, but they do not recognize capital letters.

## License

[MIT License](../../LICENSE)