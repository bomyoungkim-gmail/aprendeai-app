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
exports.PrismaApprovalsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const pending_approval_entity_1 = require("../../domain/pending-approval.entity");
let PrismaApprovalsRepository = class PrismaApprovalsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(approval) {
        const created = await this.prisma.pending_user_approvals.create({
            data: {
                id: approval.id,
                institution_id: approval.institutionId,
                email: approval.email,
                name: approval.name,
                temp_password_hash: approval.tempPasswordHash,
                requested_role: approval.requestedRole,
                status: approval.status,
            },
        });
        return this.mapToDomain(created);
    }
    async findById(id) {
        const found = await this.prisma.pending_user_approvals.findUnique({
            where: { id },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findByInstitution(institutionId, status) {
        const all = await this.prisma.pending_user_approvals.findMany({
            where: { institution_id: institutionId, status: status },
            orderBy: { created_at: "asc" },
        });
        return all.map(this.mapToDomain);
    }
    async update(id, updates) {
        const updated = await this.prisma.pending_user_approvals.update({
            where: { id },
            data: {
                status: updates.status,
                reviewed_by: updates.reviewedBy,
                reviewed_at: updates.reviewedAt,
                rejection_reason: updates.rejectionReason,
            },
        });
        return this.mapToDomain(updated);
    }
    async countPending(institutionId) {
        return this.prisma.pending_user_approvals.count({
            where: { institution_id: institutionId, status: "PENDING" },
        });
    }
    mapToDomain(item) {
        return new pending_approval_entity_1.PendingApproval({
            id: item.id,
            institutionId: item.institution_id,
            email: item.email,
            name: item.name,
            tempPasswordHash: item.temp_password_hash,
            requestedRole: item.requested_role,
            status: item.status,
            rejectionReason: item.rejection_reason,
            reviewedBy: item.reviewed_by,
            reviewedAt: item.reviewed_at,
            createdAt: item.created_at,
        });
    }
};
exports.PrismaApprovalsRepository = PrismaApprovalsRepository;
exports.PrismaApprovalsRepository = PrismaApprovalsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaApprovalsRepository);
//# sourceMappingURL=prisma-approvals.repository.js.map