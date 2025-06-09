import {createCipheriv, createDecipheriv, randomBytes, scrypt} from 'node:crypto';
import {promisify} from 'node:util';

const algorithm = 'aes-256-gcm';
const scryptAsync = promisify(scrypt);

// Generate a key from a password and salt
const generateKey = async (password: string, salt: Buffer): Promise<Buffer> => {
    return (await scryptAsync(password, salt, 32)) as Buffer;
};

export interface EncryptionResult {
    encrypted: Buffer;
    iv: Buffer;
    salt: Buffer;
    authTag: Buffer;
}

export const encryptBuffer = async (buffer: Buffer, password: string): Promise<EncryptionResult> => {
    // Generate random salt and IV
    const salt = randomBytes(16);
    const iv = randomBytes(12); // 12 bytes for GCM

    // Derive key from password and salt
    const key = await generateKey(password, salt);

    // Create cipher
    const cipher = createCipheriv(algorithm, key, iv);

    // Encrypt the buffer
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv,
        salt,
        authTag
    };
};

export const decryptBuffer = async (
    encryptionResult: EncryptionResult,
    password: string
): Promise<Buffer> => {
    const {encrypted, iv, salt, authTag} = encryptionResult;

    // Derive key from password and salt
    const key = await generateKey(password, salt);

    // Create decipher
    const decipher = createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the buffer
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted;
};

// Helper function to encode encryption result as a single buffer
export const encodeEncryptionResult = (result: EncryptionResult): Buffer => {
    // Format: [salt(16)] + [iv(12)] + [authTag(16)] + [encrypted data]
    return Buffer.concat([
        result.salt,
        result.iv,
        result.authTag,
        result.encrypted
    ]);
};

// Helper function to decode encryption result from buffer
export const decodeEncryptionResult = (buffer: Buffer): EncryptionResult => {
    // Extract components based on known sizes
    const salt = buffer.subarray(0, 16);
    const iv = buffer.subarray(16, 28);
    const authTag = buffer.subarray(28, 44);
    const encrypted = buffer.subarray(44);

    return {
        salt,
        iv,
        authTag,
        encrypted
    };
};