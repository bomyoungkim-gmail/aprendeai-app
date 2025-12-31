"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const notifications_gateway_1 = require("./notifications.gateway");
const jwt_1 = require("@nestjs/jwt");
const email_module_1 = require("../email/email.module");
const send_notification_use_case_1 = require("./application/use-cases/send-notification.use-case");
const email_channel_adapter_1 = require("./infrastructure/adapters/email-channel.adapter");
const websocket_channel_adapter_1 = require("./infrastructure/adapters/websocket-channel.adapter");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            email_module_1.EmailModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || "your-secret-key",
                signOptions: { expiresIn: "7d" },
            }),
        ],
        providers: [
            notifications_gateway_1.NotificationsGateway,
            send_notification_use_case_1.SendNotificationUseCase,
            email_channel_adapter_1.EmailChannelAdapter,
            websocket_channel_adapter_1.WebSocketChannelAdapter,
            {
                provide: "NOTIFICATION_CHANNELS",
                useFactory: (email, ws) => [
                    email,
                    ws,
                ],
                inject: [email_channel_adapter_1.EmailChannelAdapter, websocket_channel_adapter_1.WebSocketChannelAdapter],
            },
        ],
        exports: [notifications_gateway_1.NotificationsGateway, send_notification_use_case_1.SendNotificationUseCase],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map