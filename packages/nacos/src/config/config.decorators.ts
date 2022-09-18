import { CONFIG_METAKEY, ConfigType } from './constants';

/**
 * Policy Config Decorator
 * @param dataId
 * @param group
 * @param format Consistent with the nacos configuration type
 * @returns (target: any, key: string) => void;
 */
export function Config(dataId: string, group?: string, format?: ConfigType) {
  const CONFIG_METADATA = {
    dataId,
    group: group || 'DEFAULT_GROUP',
    format: format || ConfigType.JSON,
  };

  return (target: any, key: string) => {
    Reflect.set(target, key, null);
    Reflect.defineMetadata(CONFIG_METAKEY, CONFIG_METADATA, target, key);
  };
}
