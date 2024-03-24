import { SubscriptionModule } from '@isnolan/nestjs-subscription';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';

import { AppService } from './app.service';
dotenv.config();

@Module({
  imports: [
    SubscriptionModule.forRoot({
      stripe: {
        apiSecretKey: `${process.env.STRIPE_SECRET_KEY}`,
        webhookSecret: `${process.env.STRIPE_SECRET_WEBHOOK}`,
      },
    }),
  ],

  providers: [AppService],
})
export class AppModule {}
