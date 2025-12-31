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
exports.SecretService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const encryption_service_1 = require("./encryption.service");
const uuid_1 = require("uuid");
let SecretService = class SecretService {
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
    }
    async listSecrets(filter) {
        const where = {};
        if (filter === null || filter === void 0 ? void 0 : filter.provider) {
            where.provider = filter.provider;
        }
        if (filter === null || filter === void 0 ? void 0 : filter.environment) {
            where.environment = filter.environment;
        }
        const secrets = await this.prisma.integration_secrets.findMany({
            where,
            select: {
                id: true,
                key: true,
                name: true,
                provider: true,
                environment: true,
                last_rotated_at: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { created_at: "desc" },
        });
        return secrets.map((secret) => (Object.assign(Object.assign({}, secret), { maskedValue: "***" + "****" })));
    }
    async getSecret(id) {
        const secret = await this.prisma.integration_secrets.findUnique({
            where: { id },
        });
        if (!secret) {
            throw new common_1.NotFoundException("Secret not found");
        }
        const decryptedValue = this.encryption.decrypt({
            encryptedValue: secret.encrypted_value,
            encryptedDek: secret.encrypted_dek,
            iv: secret.iv,
            authTag: secret.auth_tag,
            keyId: secret.key_id,
        });
        return {
            id: secret.id,
            key: secret.key,
            name: secret.name,
            value: decryptedValue,
            provider: secret.provider,
            environment: secret.environment,
            lastRotatedAt: secret.last_rotated_at,
            createdAt: secret.created_at,
            updatedAt: secret.updated_at,
        };
    }
    async getSecretByKey(key) {
        const secret = await this.prisma.integration_secrets.findUnique({
            where: { key },
        });
        if (!secret) {
            return null;
        }
        return this.encryption.decrypt({
            encryptedValue: secret.encrypted_value,
            encryptedDek: secret.encrypted_dek,
            iv: secret.iv,
            authTag: secret.auth_tag,
            keyId: secret.key_id,
        });
    }
    async createSecret(data, createdBy) {
        const existing = await this.prisma.integration_secrets.findUnique({
            where: { key: data.key },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Secret with key "${data.key}" already exists`);
        }
        const encrypted = this.encryption.encrypt(data.value);
        const secret = await this.prisma.integration_secrets.create({
            data: {
                id: (0, uuid_1.v4)(),
                updated_at: new Date(),
                key: data.key,
                name: data.name,
                provider: data.provider,
                environment: data.environment,
                encrypted_value: encrypted.encryptedValue,
                encrypted_dek: encrypted.encryptedDek,
                iv: encrypted.iv,
                auth_tag: encrypted.authTag,
                key_id: encrypted.keyId,
                created_by: createdBy,
            },
        });
        return {
            id: secret.id,
            key: secret.key,
            name: secret.name,
            maskedValue: this.encryption.maskValue(data.value),
        };
    }
    async updateSecret(id, value, reason, actorUserId, actorRole, auditLogFn) {
        const existing = await this.prisma.integration_secrets.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Secret not found");
        }
        const encrypted = this.encryption.encrypt(value);
        const updated = await this.prisma.integration_secrets.update({
            where: { id },
            data: {
                updated_at: new Date(),
                encrypted_value: encrypted.encryptedValue,
                encrypted_dek: encrypted.encryptedDek,
                iv: encrypted.iv,
                auth_tag: encrypted.authTag,
                key_id: encrypted.keyId,
                last_rotated_at: new Date(),
            },
        });
        await auditLogFn({
            actorUserId,
            actorRole,
            action: "SECRET_ROTATED",
            resourceType: "SECRET",
            resourceId: id,
            beforeJson: {
                key: existing.key,
                lastRotatedAt: existing.last_rotated_at,
            },
            afterJson: { key: updated.key, lastRotatedAt: updated.last_rotated_at },
            reason,
        });
        return {
            id: updated.id,
            key: updated.key,
            name: updated.name,
            maskedValue: this.encryption.maskValue(value),
            lastRotatedAt: updated.last_rotated_at,
        };
    }
    async deleteSecret(id, reason, actorUserId, actorRole, auditLogFn) {
        const existing = await this.prisma.integration_secrets.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Secret not found");
        }
        await this.prisma.integration_secrets.delete({
            where: { id },
        });
        await auditLogFn({
            actorUserId,
            actorRole,
            action: "SECRET_DELETED",
            resourceType: "SECRET",
            resourceId: id,
            beforeJson: { key: existing.key, provider: existing.provider },
            reason,
        });
        return { deleted: true };
    }
};
exports.SecretService = SecretService;
exports.SecretService = SecretService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], SecretService);
//# sourceMappingURL=secret.service.js.map