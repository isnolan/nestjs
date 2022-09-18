export interface ConfigOptions {
  server: string;
  namespace: string;
}

export interface ConfigAsyncOptions {
  useFactory(...args: any[]): Promise<ConfigOptions> | ConfigOptions;
  inject?: any[];
}
