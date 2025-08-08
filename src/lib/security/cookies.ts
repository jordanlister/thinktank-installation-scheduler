// Think Tank Technologies - Secure Cookie Management

import type { CookieConfig } from './types';

/**
 * Default secure cookie configuration
 */
export const DEFAULT_COOKIE_CONFIG: CookieConfig = {
  secure: true, // Only send over HTTPS
  httpOnly: true, // Not accessible via JavaScript
  sameSite: 'strict', // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
  prefix: '__Secure-TTT-' // Secure cookie prefix
};

/**
 * Cookie security levels
 */
export enum CookieSecurityLevel {
  BASIC = 'basic',
  SECURE = 'secure',
  STRICT = 'strict'
}

/**
 * Gets cookie configuration based on security level
 */
export function getCookieConfig(
  level: CookieSecurityLevel = CookieSecurityLevel.SECURE,
  isDevelopment: boolean = false
): CookieConfig {
  const baseConfig: CookieConfig = {
    secure: !isDevelopment, // Allow non-HTTPS in development
    httpOnly: true,
    sameSite: 'lax', // More permissive for development
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    prefix: isDevelopment ? 'TTT-' : '__Secure-TTT-'
  };

  switch (level) {
    case CookieSecurityLevel.BASIC:
      return {
        ...baseConfig,
        sameSite: 'lax',
        httpOnly: false, // Allow JavaScript access
        prefix: 'TTT-'
      };

    case CookieSecurityLevel.STRICT:
      return {
        ...baseConfig,
        secure: true, // Always require HTTPS
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        prefix: '__Secure-TTT-Strict-'
      };

    case CookieSecurityLevel.SECURE:
    default:
      return baseConfig;
  }
}

/**
 * Secure cookie manager class
 */
export class SecureCookieManager {
  private config: CookieConfig;

  constructor(config?: Partial<CookieConfig>) {
    this.config = {
      ...DEFAULT_COOKIE_CONFIG,
      ...config
    };
  }

  /**
   * Sets a secure cookie
   */
  set(
    name: string, 
    value: string, 
    options: Partial<CookieConfig> = {}
  ): boolean {
    if (typeof document === 'undefined') {
      console.warn('SecureCookieManager: document is not available');
      return false;
    }

    const config = { ...this.config, ...options };
    const cookieName = this.formatCookieName(name, config.prefix);
    
    // Validate cookie name and value
    if (!this.isValidCookieName(cookieName)) {
      console.error(`Invalid cookie name: ${cookieName}`);
      return false;
    }

    if (!this.isValidCookieValue(value)) {
      console.error(`Invalid cookie value for: ${cookieName}`);
      return false;
    }

    try {
      const cookieString = this.buildCookieString(cookieName, value, config);
      document.cookie = cookieString;
      
      // Verify cookie was set
      return this.has(name);
    } catch (error) {
      console.error('Error setting cookie:', error);
      return false;
    }
  }

  /**
   * Gets a cookie value
   */
  get(name: string, prefix?: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const cookieName = this.formatCookieName(name, prefix || this.config.prefix);
    const cookies = this.parseCookies();
    return cookies[cookieName] || null;
  }

  /**
   * Checks if a cookie exists
   */
  has(name: string, prefix?: string): boolean {
    return this.get(name, prefix) !== null;
  }

  /**
   * Removes a cookie
   */
  remove(name: string, options: Partial<Pick<CookieConfig, 'path' | 'domain' | 'prefix'>> = {}): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    const config = { ...this.config, ...options };
    const cookieName = this.formatCookieName(name, config.prefix);
    
    try {
      // Set expiry date in the past to remove cookie
      const expiredCookieString = this.buildCookieString(
        cookieName, 
        '', 
        {
          ...config,
          maxAge: -1,
          secure: false, // Allow removal on HTTP
          sameSite: 'lax' // More permissive for removal
        }
      );
      
      document.cookie = expiredCookieString;
      return !this.has(name);
    } catch (error) {
      console.error('Error removing cookie:', error);
      return false;
    }
  }

  /**
   * Clears all cookies with the configured prefix
   */
  clearAll(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const cookies = this.parseCookies();
    Object.keys(cookies).forEach(cookieName => {
      if (cookieName.startsWith(this.config.prefix)) {
        const originalName = cookieName.substring(this.config.prefix.length);
        this.remove(originalName);
      }
    });
  }

  /**
   * Sets a session cookie (expires when browser closes)
   */
  setSession(name: string, value: string, options: Partial<CookieConfig> = {}): boolean {
    return this.set(name, value, {
      ...options,
      maxAge: undefined // Session cookie
    });
  }

  /**
   * Sets a persistent cookie with longer expiry
   */
  setPersistent(
    name: string, 
    value: string, 
    days: number = 30, 
    options: Partial<CookieConfig> = {}
  ): boolean {
    return this.set(name, value, {
      ...options,
      maxAge: days * 24 * 60 * 60 * 1000
    });
  }

  /**
   * Gets all cookies with the configured prefix
   */
  getAll(): Record<string, string> {
    if (typeof document === 'undefined') {
      return {};
    }

    const cookies = this.parseCookies();
    const prefixedCookies: Record<string, string> = {};

    Object.entries(cookies).forEach(([cookieName, value]) => {
      if (cookieName.startsWith(this.config.prefix)) {
        const originalName = cookieName.substring(this.config.prefix.length);
        prefixedCookies[originalName] = value;
      }
    });

    return prefixedCookies;
  }

  /**
   * Validates cookie compliance with security standards
   */
  validateCookieSecurity(): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this.config.secure && window.location.protocol === 'https:') {
      issues.push('Cookies should use Secure flag on HTTPS');
      recommendations.push('Enable secure flag for all cookies on HTTPS sites');
    }

    if (!this.config.httpOnly) {
      issues.push('Cookies are accessible via JavaScript');
      recommendations.push('Use HttpOnly flag for sensitive cookies');
    }

    if (this.config.sameSite === 'none' && !this.config.secure) {
      issues.push('SameSite=None requires Secure flag');
      recommendations.push('Set Secure flag when using SameSite=None');
    }

    if (!this.config.prefix.includes('Secure') && this.config.secure) {
      issues.push('Missing __Secure- prefix for secure cookies');
      recommendations.push('Use __Secure- prefix for secure cookies');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Private helper methods
   */
  private formatCookieName(name: string, prefix: string): string {
    return `${prefix}${name}`;
  }

  private parseCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    if (typeof document === 'undefined') {
      return cookies;
    }

    document.cookie.split(';').forEach(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name && valueParts.length > 0) {
        cookies[name] = decodeURIComponent(valueParts.join('='));
      }
    });

    return cookies;
  }

  private buildCookieString(name: string, value: string, config: CookieConfig): string {
    const parts = [`${name}=${encodeURIComponent(value)}`];

    if (config.maxAge !== undefined && config.maxAge >= 0) {
      const expiryDate = new Date(Date.now() + config.maxAge);
      parts.push(`expires=${expiryDate.toUTCString()}`);
      parts.push(`max-age=${Math.floor(config.maxAge / 1000)}`);
    }

    if (config.path) {
      parts.push(`path=${config.path}`);
    }

    if (config.domain) {
      parts.push(`domain=${config.domain}`);
    }

    if (config.secure) {
      parts.push('secure');
    }

    if (config.httpOnly) {
      parts.push('httponly');
    }

    if (config.sameSite) {
      parts.push(`samesite=${config.sameSite}`);
    }

    return parts.join('; ');
  }

  private isValidCookieName(name: string): boolean {
    // Cookie name cannot contain: ( ) < > @ , ; : \ " / [ ] ? = { } or control characters
    const invalidChars = /[()<>@,;:\\"\/\[\]?={}]/;
    const controlChars = /[\x00-\x1F\x7F]/;
    
    return !invalidChars.test(name) && !controlChars.test(name) && name.length > 0;
  }

  private isValidCookieValue(value: string): boolean {
    // Cookie value cannot contain: , ; \ " or control characters (unless quoted)
    const invalidChars = /[,;\\"]/ ;
    const controlChars = /[\x00-\x08\x0A-\x1F\x7F]/;
    
    return !invalidChars.test(value) && !controlChars.test(value);
  }
}

/**
 * Cookie consent manager
 */
export class CookieConsentManager {
  private cookieManager: SecureCookieManager;
  private consentTypes = ['necessary', 'analytics', 'marketing', 'preferences'];

  constructor(cookieManager?: SecureCookieManager) {
    this.cookieManager = cookieManager || new SecureCookieManager({
      ...DEFAULT_COOKIE_CONFIG,
      prefix: 'TTT-Consent-'
    });
  }

  /**
   * Sets user consent preferences
   */
  setConsent(preferences: Record<string, boolean>): void {
    const consentData = {
      timestamp: Date.now(),
      preferences,
      version: '1.0'
    };

    this.cookieManager.setPersistent(
      'consent', 
      JSON.stringify(consentData), 
      365 // 1 year
    );

    // Apply consent preferences
    this.applyConsent(preferences);
  }

  /**
   * Gets current consent preferences
   */
  getConsent(): Record<string, boolean> | null {
    const consentString = this.cookieManager.get('consent');
    if (!consentString) {
      return null;
    }

    try {
      const consentData = JSON.parse(consentString);
      return consentData.preferences;
    } catch {
      return null;
    }
  }

  /**
   * Checks if consent is required
   */
  isConsentRequired(): boolean {
    const consent = this.getConsent();
    return consent === null;
  }

  /**
   * Checks if specific consent type is granted
   */
  hasConsent(type: string): boolean {
    const consent = this.getConsent();
    return consent ? consent[type] === true : false;
  }

  /**
   * Respects Global Privacy Control (GPC) header
   */
  respectsGPC(): boolean {
    if (typeof navigator !== 'undefined' && 'globalPrivacyControl' in navigator) {
      return (navigator as any).globalPrivacyControl === true;
    }
    return false;
  }

  /**
   * Gets default consent based on privacy signals
   */
  getDefaultConsent(): Record<string, boolean> {
    const respectGPC = this.respectsGPC();
    
    return {
      necessary: true, // Always required
      analytics: !respectGPC,
      marketing: !respectGPC,
      preferences: !respectGPC
    };
  }

  /**
   * Applies consent preferences
   */
  private applyConsent(preferences: Record<string, boolean>): void {
    // Remove analytics cookies if not consented
    if (!preferences.analytics) {
      this.removeAnalyticsCookies();
    }

    // Remove marketing cookies if not consented
    if (!preferences.marketing) {
      this.removeMarketingCookies();
    }

    // Configure analytics based on consent
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
        personalization_storage: preferences.preferences ? 'granted' : 'denied'
      });
    }
  }

  private removeAnalyticsCookies(): void {
    // Remove Google Analytics cookies
    const gaCookies = ['_ga', '_ga_*', '_gid', '_gat', '_gtag_*'];
    gaCookies.forEach(pattern => {
      if (pattern.includes('*')) {
        // Handle wildcard patterns
        const cookies = this.getAllCookies();
        Object.keys(cookies).forEach(cookieName => {
          if (this.matchesPattern(cookieName, pattern)) {
            this.removeCookieByFullName(cookieName);
          }
        });
      } else {
        this.removeCookieByFullName(pattern);
      }
    });
  }

  private removeMarketingCookies(): void {
    // Remove common marketing cookies
    const marketingCookies = ['_fbp', '_fbc', '__utm*', 'IDE', 'test_cookie'];
    marketingCookies.forEach(pattern => {
      if (pattern.includes('*')) {
        const cookies = this.getAllCookies();
        Object.keys(cookies).forEach(cookieName => {
          if (this.matchesPattern(cookieName, pattern)) {
            this.removeCookieByFullName(cookieName);
          }
        });
      } else {
        this.removeCookieByFullName(pattern);
      }
    });
  }

  private getAllCookies(): Record<string, string> {
    if (typeof document === 'undefined') {
      return {};
    }

    const cookies: Record<string, string> = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) {
        cookies[name] = value;
      }
    });
    return cookies;
  }

  private matchesPattern(cookieName: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(cookieName);
  }

  private removeCookieByFullName(cookieName: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Try removing with different path and domain combinations
    const domains = ['', `.${window.location.hostname}`, window.location.hostname];
    const paths = ['/', ''];

    domains.forEach(domain => {
      paths.forEach(path => {
        let cookieString = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        if (path) cookieString += ` path=${path};`;
        if (domain) cookieString += ` domain=${domain};`;
        document.cookie = cookieString;
      });
    });
  }
}

// Global instances
export const secureCookieManager = new SecureCookieManager();
export const cookieConsentManager = new CookieConsentManager();

// Utility functions
export function setCookie(name: string, value: string, options?: Partial<CookieConfig>): boolean {
  return secureCookieManager.set(name, value, options);
}

export function getCookie(name: string): string | null {
  return secureCookieManager.get(name);
}

export function removeCookie(name: string): boolean {
  return secureCookieManager.remove(name);
}

export function hasConsent(type: string): boolean {
  return cookieConsentManager.hasConsent(type);
}