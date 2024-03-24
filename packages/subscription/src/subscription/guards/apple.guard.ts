import { Environment, ResponseBodyV2DecodedPayload, SignedDataVerifier } from '@apple/app-store-server-library';
import { CanActivate, ExecutionContext, Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

import type { PaymentModuleOptions } from '@/subscription/interface';

@Injectable()
export class AppleGuard implements CanActivate, OnModuleInit {
  private appleRootCAs: Buffer[];
  private verifier: SignedDataVerifier;

  constructor(
    @Inject('PAYMENT_CONFIG')
    private readonly config: PaymentModuleOptions,
  ) {}

  async onModuleInit() {
    if (!this.config.apple) {
      return;
    }

    this.appleRootCAs = await this.readAppleCerts();
    const { environment: env, bundleId } = this.config.apple;
    const environment = env === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX;
    this.verifier = new SignedDataVerifier(this.appleRootCAs, true, environment, bundleId);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.verifier) {
      throw new UnauthorizedException('Apple is not configured.');
    }
    const request = context.switchToHttp().getRequest();

    try {
      const notice: ResponseBodyV2DecodedPayload = await this.verifier.verifyAndDecodeNotification(request.body);
      const { signedTransactionInfo, signedRenewalInfo } = notice.data;
      const trans = await this.verifier.verifyAndDecodeTransaction(signedTransactionInfo);
      const renewalInfo = await this.verifier.verifyAndDecodeRenewalInfo(signedRenewalInfo);
      Object.assign(notice.data, { transactionInfo: trans, renewalInfo });
      (request as any).event = notice;

      return true;
    } catch (err) {
      throw new UnauthorizedException(`Apple webhook error: ${err.message}`);
    }
  }

  private async readAppleCerts(): Promise<Buffer[]> {
    try {
      const urls = [
        'https://www.apple.com/appleca/AppleIncRootCertificate.cer',
        'https://www.apple.com/certificateauthority/AppleComputerRootCertificate.cer',
        'https://www.apple.com/certificateauthority/AppleRootCA-G2.cer',
        'https://www.apple.com/certificateauthority/AppleRootCA-G3.cer',
      ];
      return await Promise.all(urls.map((url) => this.downloadAppleCert(url)));
    } catch (error) {
      console.error(`[apple]Error in downloading Apple certificates:`, error);
      throw error;
    }
  }

  private async downloadAppleCert(url: string): Promise<Buffer> {
    try {
      // certs 不存在则创建目录
      if (!fs.existsSync('./.certs')) {
        fs.mkdirSync('./.certs');
      }
      const localFilePath = path.join('./.certs/', path.basename(url));
      const localCertExists = fs.existsSync(localFilePath);
      if (localCertExists) {
        return fs.readFileSync(localFilePath);
      } else {
        const buffer = Buffer.from(await fetch(url).then((res) => res.arrayBuffer()));
        fs.writeFileSync(localFilePath, buffer);
        return buffer;
      }
    } catch (error) {
      console.error(`[apple]Error downloading ${url}:`, error);
      throw error;
    }
  }
}
