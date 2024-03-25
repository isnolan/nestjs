import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AppleProviderService } from '../provider';
import { BaseGuard } from './base.guard';

@Injectable()
export class AppleGuard extends BaseGuard implements CanActivate {
  constructor(private readonly provider: AppleProviderService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const event = await this.provider.validateWebhookSignature(request.body);
      (request as any).event = event;
      this.save('apple', request.body, event);
      return true;
    } catch (err) {
      this.save('apple', request.body, { error: err.message });
      throw new UnauthorizedException(`Apple webhook error: ${err.message}`);
    }
  }
}
