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
var EmailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const email_service_1 = require("./email.service");
let EmailProcessor = EmailProcessor_1 = class EmailProcessor extends bullmq_1.WorkerHost {
    constructor(emailService) {
        super();
        this.emailService = emailService;
        this.logger = new common_1.Logger(EmailProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processing email job: ${job.id} (${job.data.type})`);
        try {
            switch (job.data.type) {
                case "welcome":
                    await this.emailService.sendWelcomeEmail(job.data.data);
                    break;
                case "group-invitation":
                    await this.emailService.sendGroupInvitationEmail(job.data.data);
                    break;
                case "annotation-notification":
                    await this.emailService.sendAnnotationNotification(job.data.data);
                    break;
                case "study-reminder":
                    await this.emailService.sendStudyReminder(job.data.data);
                    break;
                default:
                    throw new Error(`Unknown email type: ${job.data.type}`);
            }
            this.logger.log(`Email sent successfully: ${job.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.EmailProcessor = EmailProcessor;
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([
    (0, bullmq_1.Processor)("email"),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map