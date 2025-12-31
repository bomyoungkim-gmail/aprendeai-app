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
var SendNotificationUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendNotificationUseCase = void 0;
const common_1 = require("@nestjs/common");
let SendNotificationUseCase = SendNotificationUseCase_1 = class SendNotificationUseCase {
    constructor(channels) {
        this.channels = channels;
        this.logger = new common_1.Logger(SendNotificationUseCase_1.name);
    }
    async execute(notification) {
        this.logger.log(`Dispatching notification ${notification.id} (${notification.type}) to user ${notification.targetUserId}`);
        const dispatchPromises = this.channels
            .filter(channel => channel.supports(notification))
            .map(async (channel) => {
            try {
                await channel.send(notification);
            }
            catch (error) {
                this.logger.error(`Failed to send notification ${notification.id} via ${channel.constructor.name}: ${error.message}`, error.stack);
            }
        });
        await Promise.all(dispatchPromises);
    }
};
exports.SendNotificationUseCase = SendNotificationUseCase;
exports.SendNotificationUseCase = SendNotificationUseCase = SendNotificationUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('NOTIFICATION_CHANNELS')),
    __metadata("design:paramtypes", [Array])
], SendNotificationUseCase);
//# sourceMappingURL=send-notification.use-case.js.map