// Think Tank Technologies - Client-Side Encryption Utilities

/**
 * Simple client-side encryption utilities for non-sensitive data
 * Note: For sensitive data, always use server-side encryption
 */

/**
 * Base64 encoding/decoding utilities
 */
export const Base64 = {
  encode: (str: string): string => {
    try {
      return btoa(encodeURIComponent(str));
    } catch (error) {
      console.error('Base64 encoding error:', error);
      return '';
    }
  },

  decode: (encoded: string): string => {
    try {
      return decodeURIComponent(atob(encoded));
    } catch (error) {
      console.error('Base64 decoding error:', error);
      return '';
    }
  }
};

/**
 * Simple XOR cipher for basic obfuscation (NOT for sensitive data)
 */
export class SimpleObfuscator {
  private key: string;

  constructor(key: string = 'TTT-2024') {
    this.key = key;
  }

  obfuscate(text: string): string {
    if (!text) return '';
    
    try {
      let result = '';
      for (let i = 0; i < text.length; i++) {
        const textChar = text.charCodeAt(i);
        const keyChar = this.key.charCodeAt(i % this.key.length);
        result += String.fromCharCode(textChar ^ keyChar);
      }
      return Base64.encode(result);
    } catch (error) {
      console.error('Obfuscation error:', error);
      return text;
    }
  }

  deobfuscate(obfuscated: string): string {
    if (!obfuscated) return '';
    
    try {
      const decoded = Base64.decode(obfuscated);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const obfuscatedChar = decoded.charCodeAt(i);
        const keyChar = this.key.charCodeAt(i % this.key.length);
        result += String.fromCharCode(obfuscatedChar ^ keyChar);
      }
      return result;
    } catch (error) {
      console.error('Deobfuscation error:', error);
      return obfuscated;
    }
  }
}

/**
 * Crypto API utilities for browser environments
 */
export class CryptoUtils {
  private static isAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           crypto.subtle !== undefined && 
           crypto.getRandomValues !== undefined;
  }

  /**
   * Generates a cryptographically secure random string
   */
  static generateRandomString(length: number = 32): string {
    if (!this.isAvailable()) {
      // Fallback for environments without crypto API
      return Math.random().toString(36).substring(2, length + 2);
    }

    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates a UUID v4
   */
  static generateUUID(): string {
    if (!this.isAvailable()) {
      // Fallback UUID generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    return crypto.randomUUID();
  }

  /**
   * Creates a simple hash of input data (for checksums, not security)
   */
  static async simpleHash(data: string): Promise<string> {
    if (!this.isAvailable()) {
      // Simple fallback hash
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Hashing error:', error);
      return '';
    }
  }

  /**
   * Generates a fingerprint of browser/device characteristics
   */
  static generateFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.cookieEnabled,
      navigator.doNotTrack || 'unknown'
    ];

    return btoa(components.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Validates data integrity using checksum
   */
  static async validateIntegrity(data: string, expectedHash: string): Promise<boolean> {
    try {
      const actualHash = await this.simpleHash(data);
      return actualHash === expectedHash;
    } catch (error) {
      console.error('Integrity validation error:', error);
      return false;
    }
  }
}

/**
 * Form data protection utilities
 */
export class FormDataProtector {
  private obfuscator: SimpleObfuscator;
  private sessionKey: string;

  constructor(sessionKey?: string) {
    this.sessionKey = sessionKey || CryptoUtils.generateRandomString(16);
    this.obfuscator = new SimpleObfuscator(this.sessionKey);
  }

  /**
   * Protects form data before storing in sessionStorage/localStorage
   */
  protectFormData(data: Record<string, any>): string {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        checksum: CryptoUtils.simpleHash(JSON.stringify(data))
      });
      
      return this.obfuscator.obfuscate(serialized);
    } catch (error) {
      console.error('Form data protection error:', error);
      return '';
    }
  }

  /**
   * Unprotects form data from storage
   */
  async unprotectFormData(protected: string): Promise<Record<string, any> | null> {
    try {
      const deobfuscated = this.obfuscator.deobfuscate(protected);
      const parsed = JSON.parse(deobfuscated);
      
      // Validate checksum
      const expectedChecksum = await CryptoUtils.simpleHash(JSON.stringify(parsed.data));
      if (expectedChecksum !== await parsed.checksum) {
        console.warn('Form data checksum validation failed');
        return null;
      }
      
      // Check age (expire after 1 hour)
      const maxAge = 60 * 60 * 1000; // 1 hour
      if (Date.now() - parsed.timestamp > maxAge) {
        console.warn('Form data has expired');
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.error('Form data unprotection error:', error);
      return null;
    }
  }

  /**
   * Securely clears form data from memory
   */
  clearFormData(element: HTMLFormElement): void {
    if (!element) return;

    // Clear form values
    const inputs = element.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
        // Overwrite with random data first
        const originalLength = input.value.length;
        input.value = CryptoUtils.generateRandomString(Math.max(originalLength, 10));
        
        // Then clear
        setTimeout(() => {
          input.value = '';
        }, 0);
      }
    });
  }
}

/**
 * Secure session storage wrapper
 */
export class SecureStorage {
  private protector: FormDataProtector;
  private prefix: string;

  constructor(prefix: string = 'TTT_SECURE_') {
    this.prefix = prefix;
    this.protector = new FormDataProtector();
  }

  /**
   * Stores data securely in sessionStorage
   */
  setItem(key: string, data: any, storage: 'session' | 'local' = 'session'): boolean {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const protectedData = this.protector.protectFormData(data);
      
      storageObj.setItem(this.prefix + key, protectedData);
      return true;
    } catch (error) {
      console.error('Secure storage set error:', error);
      return false;
    }
  }

  /**
   * Retrieves data from secure storage
   */
  async getItem(key: string, storage: 'session' | 'local' = 'session'): Promise<any> {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const protectedData = storageObj.getItem(this.prefix + key);
      
      if (!protectedData) return null;
      
      return await this.protector.unprotectFormData(protectedData);
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  }

  /**
   * Removes data from secure storage
   */
  removeItem(key: string, storage: 'session' | 'local' = 'session'): void {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      storageObj.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Secure storage remove error:', error);
    }
  }

  /**
   * Clears all secure storage items
   */
  clear(storage: 'session' | 'local' = 'session'): void {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storageObj.removeItem(key));
    } catch (error) {
      console.error('Secure storage clear error:', error);
    }
  }
}

/**
 * Password strength utilities
 */
export class PasswordUtils {
  /**
   * Calculates password strength score (0-100)
   */
  static calculateStrength(password: string): {
    score: number;
    level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
    feedback: string[];
  } {
    if (!password) {
      return { score: 0, level: 'very-weak', feedback: ['Password is required'] };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 25;
    else feedback.push('Use at least 8 characters');
    
    if (password.length >= 12) score += 15;
    else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security');

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 10;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 10;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 10;
    else feedback.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    else feedback.push('Include special characters (!@#$%^&*)');

    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Avoid repeating characters');
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      score -= 20;
      feedback.push('Avoid common patterns and dictionary words');
    }

    // Determine level
    let level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
    if (score < 30) level = 'very-weak';
    else if (score < 50) level = 'weak';
    else if (score < 70) level = 'fair';
    else if (score < 90) level = 'good';
    else level = 'strong';

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      feedback: feedback.length > 0 ? feedback : ['Password strength looks good!']
    };
  }

  /**
   * Generates a secure password
   */
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

// Global instances
export const defaultObfuscator = new SimpleObfuscator();
export const defaultFormProtector = new FormDataProtector();
export const secureStorage = new SecureStorage();

// Convenience functions
export function obfuscateData(data: string): string {
  return defaultObfuscator.obfuscate(data);
}

export function deobfuscateData(data: string): string {
  return defaultObfuscator.deobfuscate(data);
}

export function generateNonce(): string {
  return CryptoUtils.generateRandomString(16);
}

export function generateUUID(): string {
  return CryptoUtils.generateUUID();
}

export async function hashData(data: string): Promise<string> {
  return await CryptoUtils.simpleHash(data);
}