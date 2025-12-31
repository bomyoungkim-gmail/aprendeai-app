interface EncryptedData {
    encryptedValue: string;
    encryptedDek: string;
    iv: string;
    authTag: string;
    keyId: string;
}
export declare class EncryptionService {
    private masterKey;
    private readonly keyId;
    private readonly algorithm;
    constructor();
    private initializeMasterKey;
    encrypt(plaintext: string): EncryptedData;
    decrypt(data: EncryptedData): string;
    maskValue(value: string): string;
    validateMasterKey(): boolean;
    static generateMasterKey(): string;
}
export {};
