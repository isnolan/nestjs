"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NacosConfigModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NacosConfigModule = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("./config.service");
const constants_1 = require("./constants");
let NacosConfigModule = NacosConfigModule_1 = class NacosConfigModule {
    static forRoot(options) {
        return {
            module: NacosConfigModule_1,
            providers: [
                {
                    provide: constants_1.CONFIG_OPTION,
                    useValue: options,
                },
                config_service_1.NacosConfigService,
            ],
            exports: [config_service_1.NacosConfigService],
        };
    }
    static forRootAsync(options) {
        return {
            module: NacosConfigModule_1,
            providers: [
                {
                    provide: constants_1.CONFIG_OPTION,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                config_service_1.NacosConfigService,
            ],
            exports: [config_service_1.NacosConfigService],
        };
    }
};
NacosConfigModule = NacosConfigModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], NacosConfigModule);
exports.NacosConfigModule = NacosConfigModule;
