// src/firestore/firestore.module.ts
import { Firestore, Settings } from '@google-cloud/firestore';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// 定义一个注入令牌，以便在其他地方注入 Firestore 客户端
export const FIRESTORE_CLIENT = 'FIRESTORE_CLIENT';

// (可选) 定义 Firestore 配置接口
export interface FirestoreModuleOptions {
  imports?: any[]; // 允许导入 ConfigModule 等
  useFactory: (...args: any[]) => Settings | Promise<Settings>;
  inject?: any[];
}

@Global() // 使 Firestore 客户端在全局可用，无需在每个模块中导入 FirestoreModule
@Module({})
export class FirestoreModule {
  static forRoot(options: FirestoreModuleOptions): DynamicModule {
    const firestoreProvider: Provider = {
      provide: FIRESTORE_CLIENT,
      useFactory: async (...args: any[]) => {
        const firestoreSettings = await options.useFactory(...args);
        // 你可以在这里添加日志记录来确认配置
        console.log('Initializing Firestore with settings:', firestoreSettings);
        try {
          const firestore = new Firestore(firestoreSettings);
          // (可选) 测试连接 - 注意：这可能会稍微增加启动时间
          // await firestore.listCollections();
          // console.log('Firestore connection successful.');
          return firestore;
        } catch (error) {
          console.error('Failed to initialize Firestore:', error);
          throw error; // 抛出错误阻止应用启动或指示问题
        }
      },
      inject: options.inject || [],
    };

    return {
      module: FirestoreModule,
      imports: options.imports || [],
      providers: [firestoreProvider],
      exports: [firestoreProvider], // 导出 Provider 以便注入
    };
  }

  // 提供一个基于 @nestjs/config 的便捷静态方法
  static forRootAsync(): DynamicModule {
    return FirestoreModule.forRoot({
      imports: [ConfigModule], // 确保 ConfigModule 已加载
      useFactory: (configService: ConfigService) => {
        // 从环境变量或配置文件获取配置
        // 方式一：使用 GOOGLE_APPLICATION_CREDENTIALS 环境变量指向服务账号密钥文件
        // 方式二：直接提供 credentials 对象（不推荐硬编码，应来自安全配置）
        // 方式三：如果运行在 GCP 环境（如 Cloud Run, GAE, GCE）且服务账号有权限，则无需显式凭证
        const projectId = configService.get<string>('GCLOUD_PROJECT') || process.env.GCLOUD_PROJECT;
        const keyFilename =
          configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') || process.env.GOOGLE_APPLICATION_CREDENTIALS;

        const settings: Settings = {};
        if (projectId) {
          settings.projectId = projectId;
        }
        if (keyFilename) {
          settings.keyFilename = keyFilename;
        }
        // 如果需要直接传递凭证内容（例如从 secret manager 获取）
        // const credentialsJson = configService.get<string>('FIRESTORE_CREDENTIALS_JSON');
        // if (credentialsJson) {
        //   settings.credentials = JSON.parse(credentialsJson);
        // }

        if (!settings.projectId && !settings.keyFilename && !settings.credentials) {
          // 在 GCP 环境中运行时，SDK 会自动寻找凭证
          console.log('Attempting to use Application Default Credentials (ADC) for Firestore.');
        }

        // 可以添加其他 Firestore 设置，例如：
        // settings.ignoreUndefinedProperties = true;

        return settings;
      },
      inject: [ConfigService],
    });
  }
}
