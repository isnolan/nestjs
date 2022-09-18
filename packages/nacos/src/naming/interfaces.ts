export interface NamingOptions {
  server: string;
  namespace: string;
}

export interface NamingAsyncOptions {
  useFactory(...args: any[]): Promise<NamingOptions> | NamingOptions;
  inject?: any[];
}

export interface InstanceOption {
  ip: string; // IP of instance
  port: number; // Port of instance
  weight?: number; // weight of the instance, default is 1.0
  ephemeral?: boolean; // Active until the client is alive, default is true
  clusterName?: string; // Virtual cluster name
}

export interface Instance {
  instanceId: string;
  ip: string;
  port: number;
  weight: number;
  healthy: boolean;
  enabled: boolean;
  ephemeral: boolean;
  clusterName: string;
  serviceName: string;
  metadata: any;
  instanceHeartBeatInterval: number;
  instanceIdGenerator: string;
  instanceHeartBeatTimeOut: number;
  ipDeleteTimeout: number;
}
