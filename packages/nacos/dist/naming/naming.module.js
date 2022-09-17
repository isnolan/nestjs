"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NacosNamingModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NacosNamingModule = void 0;
const common_1 = require("@nestjs/common");
const naming_service_1 = require("./naming.service");
const constants_1 = require("./constants");
let NacosNamingModule = NacosNamingModule_1 = class NacosNamingModule {
    static forRoot(options) {
        return {
            module: NacosNamingModule_1,
            providers: [
                {
                    provide: constants_1.NAMING_OPTION,
                    useValue: options,
                },
                naming_service_1.NacosNamingService,
            ],
            exports: [naming_service_1.NacosNamingService],
        };
    }
    static forRootAsync(options) {
        return {
            module: NacosNamingModule_1,
            providers: [
                {
                    provide: constants_1.NAMING_OPTION,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                naming_service_1.NacosNamingService,
            ],
            exports: [naming_service_1.NacosNamingService],
        };
    }
};
NacosNamingModule = NacosNamingModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], NacosNamingModule);
exports.NacosNamingModule = NacosNamingModule;
