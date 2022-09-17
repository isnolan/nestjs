"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const constants_1 = require("./constants");
/**
 * Policy Config Decorator
 * @param dataId
 * @param group
 * @param format Consistent with the nacos configuration type
 * @returns (target: any, key: string) => void;
 */
function Config(dataId, group, format) {
    const CONFIG_METADATA = {
        dataId,
        group: group || 'DEFAULT_GROUP',
        format: format || 1 /* ConfigType.JSON */,
    };
    return (target, key) => {
        Reflect.set(target, key, null);
        Reflect.defineMetadata(constants_1.CONFIG_METAKEY, CONFIG_METADATA, target, key);
    };
}
exports.Config = Config;
