# Auth Module for NestJS

`AuthModule` is a powerful NestJS module designed to streamline auth management by providing seamless integration with popular auth platforms such as Google Sign in, and Apple Sign in .

<p>
  <a href="https://www.npmjs.com/package/@isnolan/nestjs-auth" > 
    <img src="https://img.shields.io/npm/v/@isnolan/nestjs-auth.svg?style=flat" alt="version"  />
  </a>

  <a href="https://www.npmjs.com/package/@isnolan/nestjs-auth">
    <img alt="downloads" src="https://img.shields.io/npm/dt/@isnolan/nestjs-auth.svg?style=flat" />
  </a>

  <img alt="license" src="https://img.shields.io/npm/l/@isnolan/nestjs-auth.svg" />
</p>

## Features

- Effortless integration with Google sign in, and Apple Sign in.
- Supports both synchronous and asynchronous configurations.


## Getting Started

### Installation

#### PNPM
Using PNPM
Install the package along with the Stripe peer dependency:
```sh
pnpm install --save @isnolan/nestjs-auth
```

### Import

#### Asynchronous configuration
Synchronous Configuration
To utilize SubscriptionModule, import and add it to the imports array of your NestJS module, typically AppModule. Here's a synchronous configuration example:
#### Synchronous configuration
```ts
import { AuthModule } from '@isnolan/nestjs-auth';

@Module({
  imports: [
    AuthModule.forRoot({
      google: {
        clientId: `${process.env.GOOGLE_CLIENT_ID}`
      }
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

import { AuthModule } from '@isnolan/nestjs-payment';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => config.get('auth'),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}

```


## License

[MIT License](../../LICENSE)