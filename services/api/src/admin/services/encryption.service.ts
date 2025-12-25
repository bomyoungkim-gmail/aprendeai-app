import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";

interface EncryptedData {
  encryptedValue: string; // Base64
  encryptedDek: string; // Base64 (includes auth tag)
  iv: string; // Base64
  authTag: string; // Base64
  keyId: string; // Master key version
}

@Injectable()
export class EncryptionService {
  private masterKey: Buffer;
  private readonly keyId: string = "v1";
  private readonly algorithm = "aes-256-gcm";

  constructor() {
    this.initializeMasterKey();
  }

  private initializeMasterKey() {
    const masterKeyBase64 = process.env.ADMIN_MASTER_KEY;

    if (!masterKeyBase64) {
      throw new Error(
        "ADMIN_MASTER_KEY not configured. Generate one with: node -e \"console.log(crypto.randomBytes(32).toString('base64'))\"",
      );
    }

    this.masterKey = Buffer.from(masterKeyBase64, "base64");

    if (this.masterKey.length !== 32) {
      throw new Error("ADMIN_MASTER_KEY must be 32 bytes (256 bits)");
    }
  }

  /**
   * Encrypt plaintext using envelope encryption
   * 1. Generate random Data Encryption Key (DEK)
   * 2. Encrypt plaintext with DEK
   * 3. Encrypt DEK with Master Key
   */
  encrypt(plaintext: string): EncryptedData {
    // Generate random DEK (32 bytes for AES-256)
    const dek = crypto.randomBytes(32);

    // Generate IV (12 bytes for GCM mode)
    const iv = crypto.randomBytes(12);

    // Encrypt plaintext with DEK
    const cipher = crypto.createCipheriv(this.algorithm, dek, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Encrypt DEK with master key (using same IV)
    const dekCipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
    const encryptedDek = Buffer.concat([
      dekCipher.update(dek),
      dekCipher.final(),
    ]);
    const dekAuthTag = dekCipher.getAuthTag();

    return {
      encryptedValue: encrypted.toString("base64"),
      encryptedDek: Buffer.concat([encryptedDek, dekAuthTag]).toString(
        "base64",
      ),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      keyId: this.keyId,
    };
  }

  /**
   * Decrypt encrypted data using envelope encryption
   * 1. Decrypt DEK with Master Key
   * 2. Decrypt ciphertext with DEK
   */
  decrypt(data: EncryptedData): string {
    try {
      // Decode base64
      const iv = Buffer.from(data.iv, "base64");
      const encrypted = Buffer.from(data.encryptedValue, "base64");
      const authTag = Buffer.from(data.authTag, "base64");
      const encryptedDekWithTag = Buffer.from(data.encryptedDek, "base64");

      // Split encrypted DEK and its auth tag (last 16 bytes)
      const encryptedDek = encryptedDekWithTag.slice(0, -16);
      const dekAuthTag = encryptedDekWithTag.slice(-16);

      // Decrypt DEK with master key
      const dekDecipher = crypto.createDecipheriv(
        this.algorithm,
        this.masterKey,
        iv,
      );
      dekDecipher.setAuthTag(dekAuthTag);
      const dek = Buffer.concat([
        dekDecipher.update(encryptedDek),
        dekDecipher.final(),
      ]);

      // Decrypt value with DEK
      const decipher = crypto.createDecipheriv(this.algorithm, dek, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (error) {
      throw new UnauthorizedException(
        "Failed to decrypt: invalid key or corrupted data",
      );
    }
  }

  /**
   * Mask secret value for display (show only last 6 characters)
   */
  maskValue(value: string): string {
    if (value.length <= 6) {
      return "***";
    }
    const lastChars = value.slice(-6);
    return `***${lastChars}`;
  }

  /**
   * Validate master key is configured correctly
   */
  validateMasterKey(): boolean {
    try {
      const testData = this.encrypt("test");
      const decrypted = this.decrypt(testData);
      return decrypted === "test";
    } catch {
      return false;
    }
  }

  /**
   * Generate a new master key (for initial setup or rotation)
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString("base64");
  }
}
