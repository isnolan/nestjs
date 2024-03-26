import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { GoogleProviderService } from '../provider';
import { BaseGuard } from './apple.guard';

@Injectable()
export class GoogleGuard extends BaseGuard implements CanActivate {
  constructor(private readonly provider: GoogleProviderService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const notice = await this.provider.validateWebhookSignature(request.body);
      (request as any).notice = notice;
      this.save('google', notice);
      return true;
      return true;
    } catch (err) {
      this.save('google', { error: err.message });
      throw new UnauthorizedException(`Google webhook error: ${err.message}`);
    }
  }
}
