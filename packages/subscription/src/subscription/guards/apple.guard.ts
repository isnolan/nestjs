import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { AppleProviderService } from '../provider';

@Injectable()
export class AppleGuard implements CanActivate {
  constructor(private readonly provider: AppleProviderService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const event = await this.provider.validateWebhookSignature(request.body);
    (request as any).event = event;
    return true;
  }
}
