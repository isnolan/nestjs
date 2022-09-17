"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NacosConfigService = void 0;
const nacos_1 = require("nacos");
const yaml_1 = require("yaml");
const content_1 = require("properties-file/content");
const common_1 = require("@nestjs/common");
const modules_container_1 = require("@nestjs/core/injector/modules-container");
const constants_1 = require("./constants");
let NacosConfigService = class NacosConfigService {
    constructor(options, container) {
        this.container = container;
        this.client = null;
        this.listeners = new Array();
        // Config client instance
        const { server: serverAddr, namespace } = options;
        this.client = new nacos_1.NacosConfigClient({ serverAddr, namespace });
    }
    /**
     * 模块初始化
     */
    onModuleInit() {
        return __awaiter(this, void 0, void 0, function* () {
            // 搜索所有应用装饰器的模块
            yield this.scanProviderPropertyMetadates(constants_1.CONFIG_METAKEY, (instance, propertyKey, { dataId, group, format }) => __awaiter(this, void 0, void 0, function* () {
                // 将搜索到有元数据的实例，添加进入监听者数组
                this.listeners.push({
                    dataId,
                    group,
                    listener: (content) => __awaiter(this, void 0, void 0, function* () {
                        let config;
                        try {
                            // 解析配置，转化为JSON类型
                            switch (format) {
                                case 1 /* ConfigType.JSON */:
                                    config = JSON.parse(content);
                                    break;
                                case 3 /* ConfigType.YAML */:
                                    config = (0, yaml_1.parse)(content);
                                    break;
                                case 5 /* ConfigType.PROPERTIES */:
                                    config = (0, content_1.propertiesToJson)(content);
                                    break;
                                default: // 其它类型不做解析
                                    config = content;
                                    break;
                            }
                        }
                        catch (err) {
                            console.error(`Parsing failed! group:${group} dataId:${dataId}`);
                        }
                        instance[propertyKey] = config;
                    }),
                });
            }));
            // 监听所有配置变更
            for (const { dataId, group, listener } of this.listeners) {
                this.client.subscribe({ dataId, group }, listener);
                console.log(`Subscribed! group: ${group} dataId: ${dataId}`);
            }
        });
    }
    scanProviderPropertyMetadates(metaKey, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.scanProvider((instance) => __awaiter(this, void 0, void 0, function* () {
                for (const propertyKey in instance) {
                    const metaData = Reflect.getMetadata(metaKey, instance, propertyKey);
                    if (metaData) {
                        yield cb(instance, propertyKey, metaData);
                    }
                }
            }));
        });
    }
    scanProvider(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const instances = [];
            this.container.forEach(({ providers }) => {
                providers.forEach(({ instance }) => {
                    if (instance && typeof instance === 'object') {
                        instances.push(instance);
                    }
                });
            });
            for (const instance of instances) {
                yield cb(instance);
            }
        });
    }
    /**
     * 模块销毁
     */
    onModuleDestroy() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const { dataId, group, listener } of this.listeners) {
                this.client.unSubscribe({ dataId, group }, listener);
            }
            this.listeners.length = 0;
            if (this.client) {
                this.client.close();
                this.client = null;
            }
        });
    }
};
NacosConfigService = __decorate([
    __param(0, (0, common_1.Inject)(constants_1.CONFIG_OPTION)),
    __metadata("design:paramtypes", [Object, modules_container_1.ModulesContainer])
], NacosConfigService);
exports.NacosConfigService = NacosConfigService;
