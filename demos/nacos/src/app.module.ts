import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NacosConfigModule, NacosNamingModule, NacosNamingService } from '@yhostc/nest-nacos';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './configuration';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Instance Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`./.env.${process.env.NODE_ENV}`, `./.env`],
      load: [configuration],
    }),

    // Prolicy Config
    NacosConfigModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('nacos'),
    }),

    // Nacos Naming
    NacosNamingModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('nacos'),
    }),

    UsersModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(naming: NacosNamingService) {
    naming.registerInstance('test', { ip: '127.0.0.1', port: 3000 }).then(() => {
      naming.getAllInstances('test').then(async (data) => {
        console.log(`->all instance:`, data);
        console.log(`->`, naming.getServerStatus());
      });

      naming
        .subscribe({ serviceName: 'test' }, (result) => {
          console.log(`->subscribe1`, result);
        })
        .then((data) => {
          console.log(`->subscribe2`, data);
        });
    });
  }
}
