import { SubscriptionModule } from '@isnolan/nestjs-subscription';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';

import { AppService } from './app.service';
dotenv.config();

@Module({
  imports: [
    SubscriptionModule.forRootAsync({
      inject: [],
      useFactory: async () => {
        return {
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
        };
      },
    }),
  ],

  providers: [AppService],
})
export class AppModule {}
