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
exports.CreateStudyGroupUseCase = void 0;
const common_1 = require("@nestjs/common");
const study_groups_repository_interface_1 = require("../../domain/study-groups.repository.interface");
const study_group_entity_1 = require("../../domain/study-group.entity");
const prisma_service_1 = require("../../../prisma/prisma.service");
const uuid_1 = require("uuid");
let CreateStudyGroupUseCase = class CreateStudyGroupUseCase {
    constructor(repository, prisma) {
        this.repository = repository;
        this.prisma = prisma;
    }
    async execute(userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const groupId = (0, uuid_1.v4)();
            const group = new study_group_entity_1.StudyGroup({
                id: groupId,
                name: dto.name,
                scopeType: dto.scope_type,
                scopeId: dto.scope_id,
                ownerId: userId,
            });
            const created = await tx.study_groups.create({
                data: {
                    id: group.id,
                    name: group.name,
                    scope_type: group.scopeType,
                    scope_id: group.scopeId,
                    users_owner: { connect: { id: userId } },
                },
            });
            await tx.study_group_members.create({
                data: {
                    group_id: created.id,
                    user_id: userId,
                    role: "OWNER",
                    status: "ACTIVE",
                },
            });
            return new study_group_entity_1.StudyGroup({
                id: created.id,
                name: created.name,
                scopeId: created.scope_id,
                scopeType: created.scope_type,
                ownerId: userId,
            });
        });
    }
};
exports.CreateStudyGroupUseCase = CreateStudyGroupUseCase;
exports.CreateStudyGroupUseCase = CreateStudyGroupUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(study_groups_repository_interface_1.IStudyGroupsRepository)),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService])
], CreateStudyGroupUseCase);
//# sourceMappingURL=create-study-group.use-case.js.map