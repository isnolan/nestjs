export interface NamingOptions {
    server: string;
    namespace: string;
}
export interface NamingAsyncOptions {
    useFactory(...args: any[]): Promise<NamingOptions> | NamingOptions;
    inject?: any[];
}
export interface InstanceOption {
    ip: string;
    port: number;
    weight?: number;
    ephemeral?: boolean;
    clusterName?: string;
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
