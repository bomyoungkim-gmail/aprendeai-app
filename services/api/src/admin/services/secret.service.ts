import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { UserRole, Environment } from '@prisma/client';

@Injectable()
export class SecretService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async listSecrets(filter?: { provider?: string; environment?: Environment }) {
    const where: any = {};
    
    if (filter?.provider) {
      where.provider = filter.provider;
    }
    
    if (filter?.environment) {
      where.environment = filter.environment;
    }

    const secrets = await this.prisma.integrationSecret.findMany({
      where,
      select: {
        id: true,
        key: true,
        name: true,
        provider: true,
        environment: true,
        lastRotatedAt: true,
        createdAt: true,
        updatedAt: true,
        // NEVER return encrypted fields in list
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add masked value for display
    return secrets.map(secret => ({
      ...secret,
      maskedValue: '***' + '****',  // Placeholder since we don't decrypt in list
    }));
  }

  async getSecret(id: string) {
    const secret = await this.prisma.integrationSecret.findUnique({
      where: { id },
    });

    if (!secret) {
      throw new NotFoundException('Secret not found');
    }

    // Decrypt the value
    const decryptedValue = this.encryption.decrypt({
      encryptedValue: secret.encryptedValue,
      encryptedDek: secret.encryptedDek,
      iv: secret.iv,
      authTag: secret.authTag,
      keyId: secret.keyId,
    });

    return {
      id: secret.id,
      key: secret.key,
      name: secret.name,
      value: decryptedValue,  // Return plaintext (ADMIN only!)
      provider: secret.provider,
      environment: secret.environment,
      lastRotatedAt: secret.lastRotatedAt,
      createdAt: secret.createdAt,
      updatedAt: secret.updatedAt,
    };
  }

  async getSecretByKey(key: string): Promise<string | null> {
    const secret = await this.prisma.integrationSecret.findUnique({
      where: { key },
    });

    if (!secret) {
      return null;
    }

    return this.encryption.decrypt({
      encryptedValue: secret.encryptedValue,
      encryptedDek: secret.encryptedDek,
      iv: secret.iv,
      authTag: secret.authTag,
      keyId: secret.keyId,
    });
  }

  async createSecret(
    data: {
      key: string;
      name: string;
      value: string;
      provider?: string;
      environment?: string;
    },
    createdBy: string,
  ) {
    // Check if key already exists
    const existing = await this.prisma.integrationSecret.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new BadRequestException(`Secret with key "${data.key}" already exists`);
    }

    // Encrypt the value
    const encrypted = this.encryption.encrypt(data.value);

    const secret = await this.prisma.integrationSecret.create({
      data: {
        key: data.key,
        name: data.name,
        provider: data.provider,
        environment: data.environment as Environment,
        encryptedValue: encrypted.encryptedValue,
        encryptedDek: encrypted.encryptedDek,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyId: encrypted.keyId,
        createdBy,
      },
    });

    return {
      id: secret.id,
      key: secret.key,
      name: secret.name,
      maskedValue: this.encryption.maskValue(data.value),
    };
  }

  async updateSecret(
    id: string,
    value: string,
    reason: string,
    actorUserId: string,
    actorRole: UserRole,
    auditLogFn: (data: any) => Promise<any>,
  ) {
    const existing = await this.prisma.integrationSecret.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Secret not found');
    }

    // Encrypt new value
    const encrypted = this.encryption.encrypt(value);

    const updated = await this.prisma.integrationSecret.update({
      where: { id },
      data: {
        encryptedValue: encrypted.encryptedValue,
        encryptedDek: encrypted.encryptedDek,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyId: encrypted.keyId,
        lastRotatedAt: new Date(),
      },
    });

    // Audit log (without plaintext values!)
    await auditLogFn({
      actorUserId,
      actorRole,
      action: 'SECRET_ROTATED',
      resourceType: 'SECRET',
      resourceId: id,
      beforeJson: { key: existing.key, lastRotatedAt: existing.lastRotatedAt },
      afterJson: { key: updated.key, lastRotatedAt: updated.lastRotatedAt },
      reason,
    });

    return {
      id: updated.id,
      key: updated.key,
      name: updated.name,
      maskedValue: this.encryption.maskValue(value),
      lastRotatedAt: updated.lastRotatedAt,
    };
  }

  async deleteSecret(
    id: string,
    reason: string,
    actorUserId: string,
    actorRole: UserRole,
    auditLogFn: (data: any) => Promise<any>,
  ) {
    const existing = await this.prisma.integrationSecret.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Secret not found');
    }

    await this.prisma.integrationSecret.delete({
      where: { id },
    });

    // Audit log
    await auditLogFn({
      actorUserId,
      actorRole,
      action: 'SECRET_DELETED',
      resourceType: 'SECRET',
      resourceId: id,
      beforeJson: { key: existing.key, provider: existing.provider },
      reason,
    });

    return { deleted: true };
  }
}
