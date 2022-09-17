import { Injectable } from '@nestjs/common';
import { Config } from '@yhostc/nest-nacos';

@Injectable()
export class UsersService {
  // 获取nacos中配置的配置 如果有修改 此处会自动同步
  @Config('test.json')
  config: { a: number } = undefined as any;

  constructor() {
    setInterval(() => {
      console.log(`->config:`, this.config);
    }, 5000);
  }
}
