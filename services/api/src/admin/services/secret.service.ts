import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EncryptionService } from "./encryption.service";
import { Environment } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

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
        // NEVER return encrypted fields in list
      },
      orderBy: { created_at: "desc" },
    });

    // Add masked value for display
    return secrets.map((secret) => ({
      ...secret,
      maskedValue: "***" + "****", // Placeholder since we don't decrypt in list
    }));
  }

  async getSecret(id: string) {
    const secret = await this.prisma.integration_secrets.findUnique({
      where: { id },
    });

    if (!secret) {
      throw new NotFoundException("Secret not found");
    }

    // Decrypt the value
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
      value: decryptedValue, // Return plaintext (ADMIN only!)
      provider: secret.provider,
      environment: secret.environment,
      lastRotatedAt: secret.last_rotated_at,
      createdAt: secret.created_at,
      updatedAt: secret.updated_at,
    };
  }

  async getSecretByKey(key: string): Promise<string | null> {
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
    const existing = await this.prisma.integration_secrets.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new BadRequestException(
        `Secret with key "${data.key}" already exists`,
      );
    }

    // Encrypt the value
    const encrypted = this.encryption.encrypt(data.value);

    const secret = await this.prisma.integration_secrets.create({
      data: {
        id: uuidv4(),
        updated_at: new Date(),
        key: data.key,
        name: data.name,
        provider: data.provider,
        environment: data.environment as Environment,
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

  async updateSecret(
    id: string,
    value: string,
    reason: string,
    actorUserId: string,
    actorRole: string,
    auditLogFn: (data: any) => Promise<any>,
  ) {
    const existing = await this.prisma.integration_secrets.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Secret not found");
    }

    // Encrypt new value
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

    // Audit log (without plaintext values!)
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

  async deleteSecret(
    id: string,
    reason: string,
    actorUserId: string,
    actorRole: string,
    auditLogFn: (data: any) => Promise<any>,
  ) {
    const existing = await this.prisma.integration_secrets.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Secret not found");
    }

    await this.prisma.integration_secrets.delete({
      where: { id },
    });

    // Audit log
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
}
