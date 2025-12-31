"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const common_1 = require("@nestjs/common");
const family_event_service_1 = require("./family-event.service");
const classroom_event_service_1 = require("./classroom-event.service");
const prisma_module_1 = require("../prisma/prisma.module");
const prisma_event_repository_1 = require("./infrastructure/repositories/prisma-event.repository");
const log_event_use_case_1 = require("./application/use-cases/log-event.use-case");
const event_repository_interface_1 = require("./domain/interfaces/event.repository.interface");
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [
            family_event_service_1.FamilyEventService,
            classroom_event_service_1.ClassroomEventService,
            log_event_use_case_1.LogEventUseCase,
            { provide: event_repository_interface_1.IEventRepository, useClass: prisma_event_repository_1.PrismaEventRepository },
        ],
        exports: [family_event_service_1.FamilyEventService, classroom_event_service_1.ClassroomEventService, event_repository_interface_1.IEventRepository],
    })
], EventsModule);
//# sourceMappingURL=events.module.js.map