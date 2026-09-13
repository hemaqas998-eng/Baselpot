/**
 * Security Vault Service
 * Provides client-side AES-256-GCM encryption for personal data, broker API keys, 
 * and authentication tokens using the Web Crypto API (SubtleCrypto).
 */

const STORAGE_KEY_PASSCODE_HASH = 'mr_vault_auth_hash';
const STORAGE_KEY_SALT = 'mr_vault_salt';
const STORAGE_KEY_ENCRYPTED_DATA = 'mr_vault_payload';
const STORAGE_KEY_AUTH_STATE = 'mr_vault_is_authenticated';

export interface DecryptedVaultData {
  traderName?: string;
  deepSeekApiKey?: string;
  brokerApiKey?: string;
  brokerApiSecret?: string;
  brokerAccountPass?: string;
  savedPasscode?: string;
  lastUnlocked?: number;
}

export class SecurityVaultService {
  private memoryVault: DecryptedVaultData | null = null;
  private isUnlockedInMemory: boolean = false;

  /**
   * Check if a master passcode is already registered
   */
  public hasPasscode(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(STORAGE_KEY_PASSCODE_HASH));
  }

  /**
   * Check if the user is currently authenticated / unlocked
   */
  public isUnlocked(): boolean {
    if (typeof window === 'undefined') return false;
    const sessionAuth = sessionStorage.getItem(STORAGE_KEY_AUTH_STATE);
    return this.isUnlockedInMemory || sessionAuth === 'true';
  }

  /**
   * Register or reset a new Master PIN / Passcode with PBKDF2 Key Derivation
   */
  public async setMasterPasscode(passcode: string): Promise<boolean> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const keyMaterial = await this.getKeyMaterial(passcode);
      const derivedKey = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );

      const hashHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      localStorage.setItem(STORAGE_KEY_SALT, saltHex);
      localStorage.setItem(STORAGE_KEY_PASSCODE_HASH, hashHex);
      
      this.isUnlockedInMemory = true;
      sessionStorage.setItem(STORAGE_KEY_AUTH_STATE, 'true');

      return true;
    } catch (err) {
      console.error('Failed to set master passcode:', err);
      return false;
    }
  }

  /**
   * Authenticate and unlock the platform
   */
  public async unlock(passcode: string): Promise<boolean> {
    try {
      const saltHex = localStorage.getItem(STORAGE_KEY_SALT);
      const storedHash = localStorage.getItem(STORAGE_KEY_PASSCODE_HASH);

      if (!saltHex || !storedHash) {
        // First-time setup if no passcode set
        await this.setMasterPasscode(passcode);
        return true;
      }

      const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const keyMaterial = await this.getKeyMaterial(passcode);
      const derivedKey = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );

      const computedHash = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');

      if (computedHash === storedHash) {
        this.isUnlockedInMemory = true;
        sessionStorage.setItem(STORAGE_KEY_AUTH_STATE, 'true');
        return true;
      }

      return false;
    } catch (err) {
      console.error('Unlock error:', err);
      return false;
    }
  }

  /**
   * Lock the platform immediately
   */
  public lock(): void {
    this.isUnlockedInMemory = false;
    this.memoryVault = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY_AUTH_STATE);
    }
  }

  /**
   * AES-GCM Encrypt sensitive data
   */
  public async encryptVaultData(data: DecryptedVaultData, passcode: string): Promise<string> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.getAesKeyFromPasscode(passcode);
      const encoded = new TextEncoder().encode(JSON.stringify(data));

      const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );

      const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(cipherBuffer), iv.length);

      const base64 = btoa(String.fromCharCode(...combined));
      localStorage.setItem(STORAGE_KEY_ENCRYPTED_DATA, base64);
      this.memoryVault = data;
      return base64;
    } catch (err) {
      console.error('Failed to encrypt vault data:', err);
      throw err;
    }
  }

  /**
   * Helper to derive AES Key
   */
  private async getKeyMaterial(passcode: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      enc.encode(passcode),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
  }

  private async getAesKeyFromPasscode(passcode: string): Promise<CryptoKey> {
    const saltHex = localStorage.getItem(STORAGE_KEY_SALT) || '0123456789abcdef0123456789abcdef';
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const keyMaterial = await this.getKeyMaterial(passcode);

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

export const securityVault = new SecurityVaultService();
