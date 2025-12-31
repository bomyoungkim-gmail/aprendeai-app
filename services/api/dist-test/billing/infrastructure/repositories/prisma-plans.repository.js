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
exports.PrismaPlansRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const plan_entity_1 = require("../../domain/entities/plan.entity");
let PrismaPlansRepository = class PrismaPlansRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(plan) {
        const created = await this.prisma.plans.create({
            data: {
                id: plan.id,
                code: plan.code,
                name: plan.name,
                description: plan.description,
                entitlements: plan.entitlements,
                monthly_price: plan.monthlyPrice,
                yearly_price: plan.yearlyPrice,
                is_active: plan.isActive,
                updated_at: new Date(),
            },
        });
        return this.mapToDomain(created);
    }
    async findById(id) {
        const found = await this.prisma.plans.findUnique({
            where: { id },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findByCode(code) {
        const found = await this.prisma.plans.findUnique({
            where: { code },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findActive() {
        const found = await this.prisma.plans.findMany({
            where: { is_active: true },
            orderBy: { monthly_price: "asc" },
        });
        return found.map(this.mapToDomain);
    }
    async update(id, updates) {
        const data = {};
        if (updates.name !== undefined)
            data.name = updates.name;
        if (updates.description !== undefined)
            data.description = updates.description;
        if (updates.entitlements !== undefined)
            data.entitlements = updates.entitlements;
        if (updates.monthlyPrice !== undefined)
            data.monthly_price = updates.monthlyPrice;
        if (updates.yearlyPrice !== undefined)
            data.yearly_price = updates.yearlyPrice;
        if (updates.isActive !== undefined)
            data.is_active = updates.isActive;
        data.updated_at = new Date();
        const updated = await this.prisma.plans.update({
            where: { id },
            data,
        });
        return this.mapToDomain(updated);
    }
    mapToDomain(item) {
        return new plan_entity_1.Plan({
            id: item.id,
            code: item.code,
            name: item.name,
            description: item.description,
            entitlements: item.entitlements,
            monthlyPrice: item.monthly_price !== null ? Number(item.monthly_price) : undefined,
            yearlyPrice: item.yearly_price !== null ? Number(item.yearly_price) : undefined,
            isActive: item.is_active,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        });
    }
};
exports.PrismaPlansRepository = PrismaPlansRepository;
exports.PrismaPlansRepository = PrismaPlansRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPlansRepository);
//# sourceMappingURL=prisma-plans.repository.js.map