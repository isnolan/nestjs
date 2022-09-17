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
exports.NacosNamingService = void 0;
const nacos_1 = require("nacos");
const common_1 = require("@nestjs/common");
const constants_1 = require("./constants");
let NacosNamingService = class NacosNamingService {
    constructor(options) {
        this.client = null;
        this.listeners = new Array();
        // Config client instance
        const { server: serverList, namespace } = options;
        this.client = new nacos_1.NacosNamingClient({
            serverList,
            namespace,
            logger: console,
        });
    }
    onModuleInit() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.ready();
        });
    }
    registerInstance(serviceName, instance, groupName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.registerInstance(serviceName, instance, groupName);
        });
    }
    deregisterInstance(serviceName, instance, groupName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.deregisterInstance(serviceName, instance, groupName);
        });
    }
    /**
     * Query instance list of service.
     * @param serviceName Service name
     * @param groupName group name, default is DEFAULT_GROUP
     * @param clusters Cluster names
     * @param subscribe whether subscribe the service, default is true
     * @returns
     */
    getAllInstances(serviceName, groupName, clusters, subscribe) {
        return __awaiter(this, void 0, void 0, function* () {
            // Naocs have an type error for Instance
            return this.client.getAllInstances(serviceName, groupName, clusters, subscribe);
        });
    }
    /**
     * Get the status of nacos server, 'UP' or 'DOWN'.
     * @returns
     */
    getServerStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.getServerStatus();
        });
    }
    /**
     * Subscribe the instances of the service
     * @param info service info, if type is string, it's the serviceName
     * @param listener the listener function, Naocs have an type error for instances
     * @returns
     */
    subscribe(info, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.subscribe(info, listener);
        });
    }
    /**
     * Unsubscribe the instances of the service
     * @param info service info, if type is string, it's the serviceName
     * @param listener the listener function, if not provide, will unSubscribe all listeners under this service
     * @returns
     */
    unSubscribe(info, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.unSubscribe(info, listener);
        });
    }
    onModuleDestroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                // NacosNamingClient not support close method
                this.client = null;
            }
        });
    }
};
NacosNamingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.NAMING_OPTION)),
    __metadata("design:paramtypes", [Object])
], NacosNamingService);
exports.NacosNamingService = NacosNamingService;
