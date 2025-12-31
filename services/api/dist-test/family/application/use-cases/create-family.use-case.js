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
exports.CreateFamilyUseCase = void 0;
const common_1 = require("@nestjs/common");
const family_repository_interface_1 = require("../../domain/family.repository.interface");
const family_entity_1 = require("../../domain/family.entity");
const prisma_service_1 = require("../../../prisma/prisma.service");
const subscription_service_1 = require("../../../billing/subscription.service");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
let CreateFamilyUseCase = class CreateFamilyUseCase {
    constructor(repository, prisma, subscriptionService) {
        this.repository = repository;
        this.prisma = prisma;
        this.subscriptionService = subscriptionService;
    }
    async execute(userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const familyId = (0, uuid_1.v4)();
            const created = await tx.families.create({
                data: {
                    id: familyId,
                    name: dto.name,
                    owner_user_id: userId,
                    updated_at: new Date(),
                }
            });
            await tx.family_members.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    family_id: familyId,
                    user_id: userId,
                    role: "OWNER",
                    status: "ACTIVE",
                }
            });
            await this.subscriptionService.createInitialSubscription(client_1.ScopeType.FAMILY, familyId);
            const user = await tx.users.findUnique({
                where: { id: userId },
                select: { settings: true },
            });
            const currentSettings = (user === null || user === void 0 ? void 0 : user.settings) || {};
            await tx.users.update({
                where: { id: userId },
                data: {
                    settings: Object.assign(Object.assign({}, currentSettings), { primaryFamilyId: familyId }),
                },
            });
            return new family_entity_1.Family({
                id: created.id,
                name: created.name,
                ownerUserId: userId,
                createdAt: created.created_at,
                updatedAt: created.updated_at,
            });
        });
    }
};
exports.CreateFamilyUseCase = CreateFamilyUseCase;
exports.CreateFamilyUseCase = CreateFamilyUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(family_repository_interface_1.IFamilyRepository)),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService])
], CreateFamilyUseCase);
//# sourceMappingURL=create-family.use-case.js.map