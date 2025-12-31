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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const user_mapper_1 = require("./user.mapper");
let UsersRepository = class UsersRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const raw = await this.prisma.users.findUnique({ where: { id } });
        return raw ? user_mapper_1.UserMapper.toDomain(raw) : null;
    }
    async findByEmail(email) {
        const raw = await this.prisma.users.findUnique({ where: { email } });
        return raw ? user_mapper_1.UserMapper.toDomain(raw) : null;
    }
    async findAll() {
        const raw = await this.prisma.users.findMany();
        return [];
    }
    async create(data) {
        const raw = await this.prisma.users.create({
            data: Object.assign(Object.assign({}, data), { updated_at: new Date() }),
        });
        return raw;
    }
    async update(id, data) {
        const updated = await this.prisma.users.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                last_context_role: data.contextRole,
                last_institution_id: data.institutionId,
                updated_at: new Date(),
            },
        });
        return user_mapper_1.UserMapper.toDomain(updated);
    }
    async delete(id) {
        await this.prisma.users.delete({ where: { id } });
    }
    async updateSettings(id, settings) {
        await this.prisma.users.update({
            where: { id },
            data: { settings },
        });
    }
    async countUsersByDomain(domainSuffix, institutionId) {
        return this.prisma.users.count({
            where: {
                email: { endsWith: domainSuffix },
                last_institution_id: institutionId,
            },
        });
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map