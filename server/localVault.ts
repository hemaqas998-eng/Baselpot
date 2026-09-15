import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface SecretItemMetadata {
  key: string;
  category: 'BROKER_METATRADER' | 'BROKER_BINANCE' | 'BROKER_BYBIT' | 'BROKER_DERIV' | 'BROKER_OTHER' | 'TIINGO_API' | 'TELEGRAM_BOT' | 'AI_API_KEY' | 'CUSTOM_SECRET';
  label: string;
  descriptionArabic?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StoredVaultItem {
  value: string;
  metadata: SecretItemMetadata;
}

interface EncryptedVaultData {
  iv: string;
  authTag: string;
  data: string;
  lastUpdated: number;
}

const VAULT_FILE_PATH = path.join(process.cwd(), 'data', 'vault.enc.json');
const DEFAULT_KEY_SALT = 'BASELPOT_QUANT_BRAIN_VAULT_SALT_v4';

export class LocalVault {
  private static masterKey: Buffer | null = null;

  private static deriveKey(passphrase: string): Buffer {
    return crypto.scryptSync(passphrase, DEFAULT_KEY_SALT, 32);
  }

  public static initializeVault(passphrase?: string): void {
    const pass = passphrase || process.env.VAULT_PASSPHRASE || 'BaselpotQuantMasterSecret2026';
    this.masterKey = this.deriveKey(pass);
  }

  public static isUnlocked(): boolean {
    return this.masterKey !== null;
  }

  public static unlock(passphrase: string): boolean {
    try {
      this.masterKey = this.deriveKey(passphrase);
      return true;
    } catch {
      return false;
    }
  }

  public static lock(): void {
    this.masterKey = null;
  }

  public static saveSecret(
    key: string, 
    secretValue: string, 
    metadata?: Partial<SecretItemMetadata>
  ): boolean {
    if (!this.masterKey) {
      this.initializeVault();
    }
    try {
      const existingItems = this.getAllRawItems();
      const existingMeta = existingItems[key]?.metadata;
      
      const now = Date.now();
      const item: StoredVaultItem = {
        value: secretValue,
        metadata: {
          key,
          category: metadata?.category || existingMeta?.category || 'CUSTOM_SECRET',
          label: metadata?.label || existingMeta?.label || key,
          descriptionArabic: metadata?.descriptionArabic || existingMeta?.descriptionArabic || '',
          createdAt: existingMeta?.createdAt || now,
          updatedAt: now
        }
      };

      existingItems[key] = item;

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey!, iv);
      
      let encrypted = cipher.update(JSON.stringify(existingItems), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      const payload: EncryptedVaultData = {
        iv: iv.toString('hex'),
        authTag,
        data: encrypted,
        lastUpdated: Date.now()
      };

      const dir = path.dirname(VAULT_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(payload, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[LocalVault] Failed to encrypt & save secret:', err);
      return false;
    }
  }

  public static deleteSecret(key: string): boolean {
    if (!this.masterKey) {
      this.initializeVault();
    }
    try {
      const existingItems = this.getAllRawItems();
      if (!existingItems[key]) {
        return false;
      }
      delete existingItems[key];

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey!, iv);
      
      let encrypted = cipher.update(JSON.stringify(existingItems), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      const payload: EncryptedVaultData = {
        iv: iv.toString('hex'),
        authTag,
        data: encrypted,
        lastUpdated: Date.now()
      };

      fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(payload, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[LocalVault] Failed to delete secret:', err);
      return false;
    }
  }

  public static getSecret(key: string): string | null {
    const all = this.getAllRawItems();
    if (!all[key]) return null;
    return all[key].value || null;
  }

  public static getAllSecrets(): Record<string, string> {
    const rawItems = this.getAllRawItems();
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawItems)) {
      result[k] = v.value;
    }
    return result;
  }

  public static getAllRawItems(): Record<string, StoredVaultItem> {
    if (!this.masterKey) {
      this.initializeVault();
    }
    if (!fs.existsSync(VAULT_FILE_PATH)) {
      return {};
    }

    try {
      const raw = fs.readFileSync(VAULT_FILE_PATH, 'utf8');
      const payload: EncryptedVaultData = JSON.parse(raw);
      
      const iv = Buffer.from(payload.iv, 'hex');
      const authTag = Buffer.from(payload.authTag, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey!, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(payload.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const parsed = JSON.parse(decrypted);
      const normalized: Record<string, StoredVaultItem> = {};

      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') {
          normalized[k] = {
            value: v,
            metadata: {
              key: k,
              category: 'CUSTOM_SECRET',
              label: k,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
          };
        } else if (typeof v === 'object' && v !== null && 'value' in v) {
          normalized[k] = v as StoredVaultItem;
        }
      }

      return normalized;
    } catch (err) {
      return {};
    }
  }

  public static getAuditSummary(): { 
    totalSecrets: number; 
    isUnlocked: boolean; 
    lastUpdated: number;
    categoriesCount: Record<string, number>;
  } {
    const items = this.getAllRawItems();
    let lastUpdated = 0;
    if (fs.existsSync(VAULT_FILE_PATH)) {
      try {
        const payload: EncryptedVaultData = JSON.parse(fs.readFileSync(VAULT_FILE_PATH, 'utf8'));
        lastUpdated = payload.lastUpdated || 0;
      } catch {}
    }

    const categoriesCount: Record<string, number> = {};
    for (const item of Object.values(items)) {
      const cat = item.metadata?.category || 'CUSTOM_SECRET';
      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    }

    return {
      totalSecrets: Object.keys(items).length,
      isUnlocked: this.isUnlocked(),
      lastUpdated,
      categoriesCount
    };
  }
}
