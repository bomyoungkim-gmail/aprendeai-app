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
var EmailWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const email_service_1 = require("../email/email.service");
const family_repository_interface_1 = require("../family/domain/family.repository.interface");
let EmailWorker = EmailWorker_1 = class EmailWorker {
    constructor(familyRepository, emailService) {
        this.familyRepository = familyRepository;
        this.emailService = emailService;
        this.logger = new common_1.Logger(EmailWorker_1.name);
    }
    async handleWeeklyReports() {
        var _a;
        this.logger.log("Starting weekly report generation...");
        const families = await this.familyRepository.findAll();
        for (const family of families) {
            if (!family.members)
                continue;
            const parents = family.members.filter((m) => m.role === "GUARDIAN" || m.role === "OWNER");
            for (const parent of parents) {
                if (!((_a = parent.user) === null || _a === void 0 ? void 0 : _a.email))
                    continue;
                this.logger.log(`Sending weekly report for family ${family.name} to ${parent.user.email}`);
            }
        }
        this.logger.log("Weekly report generation complete.");
    }
};
exports.EmailWorker = EmailWorker;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailWorker.prototype, "handleWeeklyReports", null);
exports.EmailWorker = EmailWorker = EmailWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(family_repository_interface_1.IFamilyRepository)),
    __metadata("design:paramtypes", [Object, email_service_1.EmailService])
], EmailWorker);
//# sourceMappingURL=email.worker.js.map