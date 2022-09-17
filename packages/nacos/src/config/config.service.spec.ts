import { Test, TestingModule } from '@nestjs/testing';
import { NacosConfigService } from './config.service';

describe('NacosConfigService', () => {
  let service: NacosConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NacosConfigService],
    }).compile();

    service = module.get<NacosConfigService>(NacosConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
