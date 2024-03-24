import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AppleProviderService } from '../provider';

@Injectable()
export class AppleGuard implements CanActivate {
  constructor(private readonly provider: AppleProviderService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      // const notice: ResponseBodyV2DecodedPayload = await this.verifier.verifyAndDecodeNotification(request.body);
      // const { signedTransactionInfo, signedRenewalInfo } = notice.data;
      // const trans = await this.verifier.verifyAndDecodeTransaction(signedTransactionInfo);
      // const renewalInfo = await this.verifier.verifyAndDecodeRenewalInfo(signedRenewalInfo);
      // Object.assign(notice.data, { transactionInfo: trans, renewalInfo });
      // (request as any).event = notice;

      const event = this.provider.validateWebhookSignature(request.body);
      (request as any).event = event;
      return true;
    } catch (err) {
      throw new UnauthorizedException(`Apple webhook error: ${err.message}`);
    }
  }
}
