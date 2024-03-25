# Subscription Module for NestJS

`SubscriptionModule` is a comprehensive subscription handling module for NestJS applications, providing seamless integration with multiple subscription platforms such as Stripe, Google Pay, and Apple Pay. It facilitates the handling of subscription events via webhooks, offering a unified approach to verify and process payment notifications securely.

<p>
  <a href="https://www.npmjs.com/package/@isnolan/nestjs-subscription" > 
    <img src="https://img.shields.io/npm/v/@isnolan/nestjs-subscription.svg?style=flat" alt="version"  />
  </a>

  <a href="https://www.npmjs.com/package/@isnolan/nestjs-subscription">
    <img alt="downloads" src="https://img.shields.io/npm/dt/@isnolan/nestjs-subscription.svg?style=flat" />
  </a>

  <img alt="license" src="https://img.shields.io/npm/l/@isnolan/nestjs-subscription.svg" />
</p>

## Features

- Easy integration with Stripe, Google Pay, and Apple Pay.
- Secure validation and processing of payment webhooks.
- Customizable event handlers for different payment events.
- Supports both synchronous and asynchronous configurations.


## Getting Started

### Install

#### PNPM
- Install the package along with the stripe peer dependency
```sh
`pnpm install --save @isnolan/nestjs-subscription`
```

### Import

### Asynchronous configuration
To use SubscriptionModule, import and add it to the imports array of your NestJS module, typically AppModule. Here's how you can do it:

#### Synchronous configuration
```ts
import { SubscriptionModule } from '@isnolan/nestjs-subscription';

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
SubscriptionModule also supports asynchronous configuration, which is useful when the configuration needs to be dynamically determined at runtime.

```typescript
import { SubscriptionModule } from '@isnolan/nestjs-subscription';

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
The webhooks url is

#### Appple 
> https://api.xxxx.com/v1/notify/apple

#### Google
> https://api.xxxx.com/v1/notify/google

#### Stripe
> https://api.xxxx.com/v1/notify/stripe

Follow the instructions from the [Stripe Documentation](https://stripe.com/docs/webhooks) for remaining integration steps such as testing your integration with the CLI before you go live and properly configuring the endpoint from the Stripe dashboard so that the correct events are sent to your NestJS app.

## Contribute

Contributions welcome! Read the [contribution guidelines](../../CONTRIBUTING.md) first.

## License

[MIT License](../../LICENSE)