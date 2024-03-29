import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import fs from 'fs';
import moment from 'moment-timezone';

import { AppleProviderService } from '../provider';

export class BaseGuard {
  protected async save(provider: string, notice: any) {
    const time = moment().tz('Asia/Shanghai').format('YYMMDDHHmmssSSS');
    !fs.existsSync('./notify') && fs.mkdirSync('./notify');
    fs.writeFileSync(`./notify/${time}_${provider}.json`, JSON.stringify(notice, null, 2));
  }
}

@Injectable()
export class AppleGuard extends BaseGuard implements CanActivate {
  constructor(private readonly provider: AppleProviderService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const notice = await this.provider.validateWebhookSignature(request.body);
      (request as any).notice = notice;
      this.save('apple', notice);
      return true;
    } catch (err) {
      this.save('apple', { error: err.message });
      throw new UnauthorizedException(`Apple webhook error: ${err.message}`);
    }
  }
}
