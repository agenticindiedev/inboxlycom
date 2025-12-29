import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly tagPosition = this.saltLength + this.ivLength;
  private readonly encryptedPosition = this.tagPosition + this.tagLength;

  /**
   * Get encryption key from environment or generate one
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    return crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data (credentials, tokens, etc.)
   */
  encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted
    const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);

    return result.toString('base64');
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const data = Buffer.from(encryptedData, 'base64');

    // Extract components
    const _salt = data.subarray(0, this.saltLength);
    const iv = data.subarray(this.saltLength, this.tagPosition);
    const tag = data.subarray(this.tagPosition, this.encryptedPosition);
    const encrypted = data.subarray(this.encryptedPosition);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash password or sensitive string (one-way)
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate secure random token
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
