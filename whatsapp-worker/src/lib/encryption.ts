import crypto from 'node:crypto';

/**
 * Handles AES-256-GCM encryption for WhatsApp sessions.
 * The master key must be exactly 32 bytes (256 bits).
 */
export class SessionEncryptor {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // bytes
  private static readonly AUTH_TAG_LENGTH = 16; // bytes

  /**
   * Encrypts a string using AES-256-GCM.
   * @param text The plain text to encrypt.
   * @param masterKey A 32-byte master key.
   * @returns A colon-separated string: iv:authTag:encryptedContent
   */
  static encrypt(text: string, masterKey: string): string {
    if (masterKey.length !== 32) {
      throw new Error('Master key must be exactly 32 characters long for AES-256.');
    }

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, Buffer.from(masterKey), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts a string using AES-256-GCM.
   * @param encryptedData The colon-separated string: iv:authTag:encryptedContent
   * @param masterKey A 32-byte master key.
   * @returns The decrypted plain text.
   */
  static decrypt(encryptedData: string, masterKey: string): string {
    if (masterKey.length !== 32) {
      throw new Error('Master key must be exactly 32 characters long for AES-256.');
    }

    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format.');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, Buffer.from(masterKey), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
