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
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let EncryptionService = class EncryptionService {
    constructor() {
        this.keyId = "v1";
        this.algorithm = "aes-256-gcm";
        this.initializeMasterKey();
    }
    initializeMasterKey() {
        const masterKeyBase64 = process.env.ADMIN_MASTER_KEY;
        if (!masterKeyBase64) {
            throw new Error("ADMIN_MASTER_KEY not configured. Generate one with: node -e \"console.log(crypto.randomBytes(32).toString('base64'))\"");
        }
        this.masterKey = Buffer.from(masterKeyBase64, "base64");
        if (this.masterKey.length !== 32) {
            throw new Error("ADMIN_MASTER_KEY must be 32 bytes (256 bits)");
        }
    }
    encrypt(plaintext) {
        const dek = crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.algorithm, dek, iv);
        const encrypted = Buffer.concat([
            cipher.update(plaintext, "utf8"),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        const dekCipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
        const encryptedDek = Buffer.concat([
            dekCipher.update(dek),
            dekCipher.final(),
        ]);
        const dekAuthTag = dekCipher.getAuthTag();
        return {
            encryptedValue: encrypted.toString("base64"),
            encryptedDek: Buffer.concat([encryptedDek, dekAuthTag]).toString("base64"),
            iv: iv.toString("base64"),
            authTag: authTag.toString("base64"),
            keyId: this.keyId,
        };
    }
    decrypt(data) {
        try {
            const iv = Buffer.from(data.iv, "base64");
            const encrypted = Buffer.from(data.encryptedValue, "base64");
            const authTag = Buffer.from(data.authTag, "base64");
            const encryptedDekWithTag = Buffer.from(data.encryptedDek, "base64");
            const encryptedDek = encryptedDekWithTag.slice(0, -16);
            const dekAuthTag = encryptedDekWithTag.slice(-16);
            const dekDecipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
            dekDecipher.setAuthTag(dekAuthTag);
            const dek = Buffer.concat([
                dekDecipher.update(encryptedDek),
                dekDecipher.final(),
            ]);
            const decipher = crypto.createDecipheriv(this.algorithm, dek, iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final(),
            ]);
            return decrypted.toString("utf8");
        }
        catch (error) {
            throw new common_1.UnauthorizedException("Failed to decrypt: invalid key or corrupted data");
        }
    }
    maskValue(value) {
        if (value.length <= 6) {
            return "***";
        }
        const lastChars = value.slice(-6);
        return `***${lastChars}`;
    }
    validateMasterKey() {
        try {
            const testData = this.encrypt("test");
            const decrypted = this.decrypt(testData);
            return decrypted === "test";
        }
        catch (_a) {
            return false;
        }
    }
    static generateMasterKey() {
        return crypto.randomBytes(32).toString("base64");
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map