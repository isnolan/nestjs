import { Injectable } from '@nestjs/common';
import fs from 'fs';
import moment from 'moment-timezone';

@Injectable()
export class BaseGuard {
  protected async save(platform: string, payload: any, notice: any) {
    const time = moment().tz('Asia/Shanghai').format('YYMMDDHHmmssSSS');
    !fs.existsSync('./notify') && fs.mkdirSync('./notify');
    fs.writeFileSync(`./notify/${time}_${platform}.json`, JSON.stringify({ payload, notice }, null, 2));
  }
}
