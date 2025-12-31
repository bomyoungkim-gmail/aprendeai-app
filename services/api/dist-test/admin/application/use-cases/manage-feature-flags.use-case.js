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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageFeatureFlagsUseCase = void 0;
const common_1 = require("@nestjs/common");
const admin_repository_interface_1 = require("../../domain/admin.repository.interface");
const feature_flag_entity_1 = require("../../domain/feature-flag.entity");
const audit_log_entity_1 = require("../../domain/audit-log.entity");
const uuid_1 = require("uuid");
let ManageFeatureFlagsUseCase = class ManageFeatureFlagsUseCase {
    constructor(flagsRepo, auditRepo) {
        this.flagsRepo = flagsRepo;
        this.auditRepo = auditRepo;
    }
    async create(data, actor) {
        const existing = await this.flagsRepo.findByKey(data.key);
        if (existing) {
            throw new common_1.BadRequestException(`Feature flag with key "${data.key}" already exists`);
        }
        const flag = new feature_flag_entity_1.FeatureFlag(Object.assign(Object.assign({ id: (0, uuid_1.v4)() }, data), { createdBy: actor.userId }));
        const created = await this.flagsRepo.create(flag);
        await this.auditRepo.create(new audit_log_entity_1.AuditLog({
            id: (0, uuid_1.v4)(),
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: "FEATURE_FLAG_CREATED",
            resourceType: "FEATURE_FLAG",
            resourceId: created.id,
            afterJson: created,
        }));
        return created;
    }
    async update(id, data, actor) {
        const existing = await this.flagsRepo.findById(id);
        if (!existing)
            throw new common_1.NotFoundException("Feature flag not found");
        const updated = await this.flagsRepo.update(id, data);
        await this.auditRepo.create(new audit_log_entity_1.AuditLog({
            id: (0, uuid_1.v4)(),
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: "FEATURE_FLAG_UPDATED",
            resourceType: "FEATURE_FLAG",
            resourceId: id,
            beforeJson: existing,
            afterJson: updated,
        }));
        return updated;
    }
    async toggle(id, enabled, reason, actor) {
        const existing = await this.flagsRepo.findById(id);
        if (!existing)
            throw new common_1.NotFoundException("Feature flag not found");
        const updated = await this.flagsRepo.update(id, { enabled });
        await this.auditRepo.create(new audit_log_entity_1.AuditLog({
            id: (0, uuid_1.v4)(),
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: "FEATURE_FLAG_TOGGLED",
            resourceType: "FEATURE_FLAG",
            resourceId: id,
            beforeJson: { enabled: existing.enabled },
            afterJson: { enabled: updated.enabled },
            reason,
        }));
        return updated;
    }
    async delete(id, reason, actor) {
        const existing = await this.flagsRepo.findById(id);
        if (!existing)
            return;
        await this.flagsRepo.delete(id);
        await this.auditRepo.create(new audit_log_entity_1.AuditLog({
            id: (0, uuid_1.v4)(),
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: "FEATURE_FLAG_DELETED",
            resourceType: "FEATURE_FLAG",
            resourceId: id,
            beforeJson: existing,
            reason,
        }));
    }
    async list(filter) {
        return this.flagsRepo.findMany(filter);
    }
    async get(id) {
        return this.flagsRepo.findById(id);
    }
};
exports.ManageFeatureFlagsUseCase = ManageFeatureFlagsUseCase;
exports.ManageFeatureFlagsUseCase = ManageFeatureFlagsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(admin_repository_interface_1.IFeatureFlagsRepository)),
    __param(1, (0, common_1.Inject)(admin_repository_interface_1.IAuditLogsRepository)),
    __metadata("design:paramtypes", [Object, Object])
], ManageFeatureFlagsUseCase);
//# sourceMappingURL=manage-feature-flags.use-case.js.map