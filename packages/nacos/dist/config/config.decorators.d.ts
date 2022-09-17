import { ConfigType } from './constants';
/**
 * Policy Config Decorator
 * @param dataId
 * @param group
 * @param format Consistent with the nacos configuration type
 * @returns (target: any, key: string) => void;
 */
export declare function Config(dataId: string, group?: string, format?: ConfigType): (target: any, key: string) => void;
