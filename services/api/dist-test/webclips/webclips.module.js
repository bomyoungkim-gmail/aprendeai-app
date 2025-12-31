"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebClipsModule = void 0;
const common_1 = require("@nestjs/common");
const webclips_controller_1 = require("./webclips.controller");
const webclips_service_1 = require("./webclips.service");
const prisma_module_1 = require("../prisma/prisma.module");
const cornell_module_1 = require("../cornell/cornell.module");
const sessions_module_1 = require("../sessions/sessions.module");
let WebClipsModule = class WebClipsModule {
};
exports.WebClipsModule = WebClipsModule;
exports.WebClipsModule = WebClipsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, cornell_module_1.CornellModule, sessions_module_1.SessionsModule],
        controllers: [webclips_controller_1.WebClipsController],
        providers: [webclips_service_1.WebClipsService],
        exports: [webclips_service_1.WebClipsService],
    })
], WebClipsModule);
//# sourceMappingURL=webclips.module.js.map