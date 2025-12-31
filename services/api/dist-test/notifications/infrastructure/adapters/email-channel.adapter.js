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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailChannelAdapter = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("../../../email/email.service");
let EmailChannelAdapter = class EmailChannelAdapter {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async send(notification) {
        await this.emailService.sendEmail({
            to: notification.data.email || '',
            subject: notification.title,
            template: notification.data.template || 'generic',
            context: Object.assign(Object.assign({}, notification.data), { message: notification.message }),
        });
    }
    supports(notification) {
        return notification.channels.includes('EMAIL');
    }
};
exports.EmailChannelAdapter = EmailChannelAdapter;
exports.EmailChannelAdapter = EmailChannelAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailChannelAdapter);
//# sourceMappingURL=email-channel.adapter.js.map