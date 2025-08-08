// Think Tank Technologies - Third-Party Script Security and SRI

import type { ThirdPartyConfig } from './types';

/**
 * Default third-party security configuration
 */
export const DEFAULT_THIRD_PARTY_CONFIG: ThirdPartyConfig = {
  allowedDomains: [
    'googleapis.com',
    'googletagmanager.com',
    'google-analytics.com',
    'gstatic.com',
    'vercel-analytics.com',
    'youtube.com',
    'vimeo.com',
    'unpkg.com',
    'cdnjs.cloudflare.com'
  ],
  allowedScripts: [
    {
      src: 'https://www.googletagmanager.com/gtag/js',
      crossorigin: 'anonymous'
    },
    {
      src: 'https://www.google-analytics.com/analytics.js',
      crossorigin: 'anonymous'
    }
  ],
  allowedStyles: [
    {
      href: 'https://fonts.googleapis.com/css2',
      crossorigin: 'anonymous'
    }
  ],
  allowedImages: [
    'https://images.unsplash.com',
    'https://via.placeholder.com',
    'https://www.google-analytics.com'
  ],
  enableSRI: true,
  blockUnknownScripts: true
};

/**
 * Subresource Integrity (SRI) utilities
 */
export class SRIManager {
  private config: ThirdPartyConfig;
  private knownHashes = new Map<string, string>();

  constructor(config: Partial<ThirdPartyConfig> = {}) {
    this.config = { ...DEFAULT_THIRD_PARTY_CONFIG, ...config };
    this.initializeKnownHashes();
  }

  /**
   * Generates SRI hash for a given content
   */
  async generateSRIHash(content: string, algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha384'): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      console.warn('Crypto API not available, cannot generate SRI hash');
      return '';
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest(algorithm.toUpperCase().replace('SHA', 'SHA-'), data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const base64Hash = btoa(String.fromCharCode(...hashArray));
      
      return `${algorithm}-${base64Hash}`;
    } catch (error) {
      console.error('SRI hash generation error:', error);
      return '';
    }
  }

  /**
   * Fetches and generates SRI hash for a remote resource
   */
  async fetchAndGenerateSRI(url: string, algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha384'): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.status}`);
      }
      
      const content = await response.text();
      return await this.generateSRIHash(content, algorithm);
    } catch (error) {
      console.error(`Error fetching resource for SRI: ${url}`, error);
      return '';
    }
  }

  /**
   * Validates SRI hash for existing script/style elements
   */
  validateSRI(element: HTMLScriptElement | HTMLLinkElement): boolean {
    const integrity = element.integrity;
    if (!integrity) return false;

    // In a real implementation, you would re-fetch and verify
    // For now, just check if it has a valid format
    const sriPattern = /^(sha256|sha384|sha512)-[A-Za-z0-9+/=]+$/;
    return sriPattern.test(integrity);
  }

  /**
   * Gets stored SRI hash for a URL
   */
  getSRIHash(url: string): string | undefined {
    return this.knownHashes.get(url);
  }

  /**
   * Sets SRI hash for a URL
   */
  setSRIHash(url: string, hash: string): void {
    this.knownHashes.set(url, hash);
  }

  /**
   * Initialize known hashes for common CDN resources
   */
  private initializeKnownHashes(): void {
    // These would be maintained and updated regularly in production
    const knownHashes = {
      // Google Analytics
      'https://www.google-analytics.com/analytics.js': 'sha384-example', // Would be real hash
      
      // Common CDN resources - these should be updated regularly
      'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js': 'sha384-example',
      'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js': 'sha384-example'
    };

    Object.entries(knownHashes).forEach(([url, hash]) => {
      this.knownHashes.set(url, hash);
    });
  }
}

/**
 * Third-party script manager with security controls
 */
export class ThirdPartyScriptManager {
  private config: ThirdPartyConfig;
  private sriManager: SRIManager;
  private loadedScripts = new Set<string>();
  private blockedScripts = new Set<string>();

  constructor(config: Partial<ThirdPartyConfig> = {}) {
    this.config = { ...DEFAULT_THIRD_PARTY_CONFIG, ...config };
    this.sriManager = new SRIManager(config);
    this.initializeSecurityObserver();
  }

  /**
   * Securely loads a third-party script
   */
  async loadScript(src: string, options: {
    integrity?: string;
    crossorigin?: string;
    async?: boolean;
    defer?: boolean;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  } = {}): Promise<boolean> {
    if (!this.isAllowedScript(src)) {
      this.blockedScripts.add(src);
      console.warn(`Blocked unauthorized script: ${src}`);
      options.onError?.(new Error(`Script not in allowlist: ${src}`));
      return false;
    }

    if (this.loadedScripts.has(src)) {
      options.onLoad?.();
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async ?? true;
      script.defer = options.defer ?? false;
      script.crossOrigin = options.crossorigin || 'anonymous';

      // Add SRI if available and enabled
      if (this.config.enableSRI) {
        const sriHash = options.integrity || this.sriManager.getSRIHash(src);
        if (sriHash) {
          script.integrity = sriHash;
        }
      }

      script.onload = () => {
        this.loadedScripts.add(src);
        options.onLoad?.();
        resolve(true);
      };

      script.onerror = (error) => {
        console.error(`Failed to load script: ${src}`, error);
        options.onError?.(new Error(`Script load failed: ${src}`));
        resolve(false);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Securely loads a stylesheet
   */
  async loadStylesheet(href: string, options: {
    integrity?: string;
    crossorigin?: string;
    media?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  } = {}): Promise<boolean> {
    if (!this.isAllowedStylesheet(href)) {
      console.warn(`Blocked unauthorized stylesheet: ${href}`);
      options.onError?.(new Error(`Stylesheet not in allowlist: ${href}`));
      return false;
    }

    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = options.media || 'all';
      link.crossOrigin = options.crossorigin || 'anonymous';

      // Add SRI if available and enabled
      if (this.config.enableSRI) {
        const sriHash = options.integrity || this.sriManager.getSRIHash(href);
        if (sriHash) {
          link.integrity = sriHash;
        }
      }

      link.onload = () => {
        options.onLoad?.();
        resolve(true);
      };

      link.onerror = (error) => {
        console.error(`Failed to load stylesheet: ${href}`, error);
        options.onError?.(new Error(`Stylesheet load failed: ${href}`));
        resolve(false);
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Preloads a resource with security checks
   */
  preloadResource(href: string, as: 'script' | 'style' | 'font' | 'image', options: {
    integrity?: string;
    crossorigin?: string;
  } = {}): void {
    if (!this.isAllowedDomain(href)) {
      console.warn(`Blocked preload of unauthorized resource: ${href}`);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (options.crossorigin) {
      link.crossOrigin = options.crossorigin;
    }

    if (this.config.enableSRI && options.integrity) {
      link.integrity = options.integrity;
    }

    document.head.appendChild(link);
  }

  /**
   * Checks if a script URL is allowed
   */
  isAllowedScript(src: string): boolean {
    // Check explicit allowlist
    const isExplicitlyAllowed = this.config.allowedScripts.some(script => {
      return src.startsWith(script.src) || src === script.src;
    });

    if (isExplicitlyAllowed) return true;

    // Check domain allowlist
    return this.isAllowedDomain(src);
  }

  /**
   * Checks if a stylesheet URL is allowed
   */
  isAllowedStylesheet(href: string): boolean {
    // Check explicit allowlist
    const isExplicitlyAllowed = this.config.allowedStyles.some(style => {
      return href.startsWith(style.href) || href === style.href;
    });

    if (isExplicitlyAllowed) return true;

    // Check domain allowlist
    return this.isAllowedDomain(href);
  }

  /**
   * Checks if a domain is allowed
   */
  isAllowedDomain(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      return this.config.allowedDomains.some(domain => {
        return hostname === domain || hostname.endsWith('.' + domain);
      });
    } catch {
      // Invalid URL
      return false;
    }
  }

  /**
   * Gets loading statistics
   */
  getStats(): {
    loadedScripts: string[];
    blockedScripts: string[];
    allowedDomains: string[];
  } {
    return {
      loadedScripts: Array.from(this.loadedScripts),
      blockedScripts: Array.from(this.blockedScripts),
      allowedDomains: this.config.allowedDomains
    };
  }

  /**
   * Audits existing scripts on the page
   */
  auditExistingScripts(): {
    authorized: HTMLScriptElement[];
    unauthorized: HTMLScriptElement[];
    withoutSRI: HTMLScriptElement[];
  } {
    const authorized: HTMLScriptElement[] = [];
    const unauthorized: HTMLScriptElement[] = [];
    const withoutSRI: HTMLScriptElement[] = [];

    document.querySelectorAll('script[src]').forEach(script => {
      const scriptEl = script as HTMLScriptElement;
      const src = scriptEl.src;

      if (this.isAllowedScript(src)) {
        authorized.push(scriptEl);
        
        if (this.config.enableSRI && !scriptEl.integrity) {
          withoutSRI.push(scriptEl);
        }
      } else {
        unauthorized.push(scriptEl);
      }
    });

    return { authorized, unauthorized, withoutSRI };
  }

  /**
   * Initializes mutation observer to monitor for unauthorized scripts
   */
  private initializeSecurityObserver(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check for unauthorized scripts
            if (element.tagName === 'SCRIPT') {
              const script = element as HTMLScriptElement;
              if (script.src && !this.isAllowedScript(script.src) && this.config.blockUnknownScripts) {
                console.warn(`Removing unauthorized script: ${script.src}`);
                script.remove();
                this.blockedScripts.add(script.src);
              }
            }

            // Check scripts in added subtree
            const scripts = element.querySelectorAll('script[src]');
            scripts.forEach(scriptEl => {
              const script = scriptEl as HTMLScriptElement;
              if (!this.isAllowedScript(script.src) && this.config.blockUnknownScripts) {
                console.warn(`Removing unauthorized script: ${script.src}`);
                script.remove();
                this.blockedScripts.add(script.src);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

/**
 * Content Security Policy helpers for third-party resources
 */
export class CSPThirdPartyHelper {
  private config: ThirdPartyConfig;

  constructor(config: Partial<ThirdPartyConfig> = {}) {
    this.config = { ...DEFAULT_THIRD_PARTY_CONFIG, ...config };
  }

  /**
   * Generates CSP script-src directive for allowed third parties
   */
  generateScriptSrcDirective(): string[] {
    const sources = ["'self'"];
    
    // Add allowed domains
    this.config.allowedDomains.forEach(domain => {
      sources.push(`https://${domain}`);
      sources.push(`https://*.${domain}`);
    });

    // Add specific script sources
    this.config.allowedScripts.forEach(script => {
      try {
        const url = new URL(script.src);
        const origin = `${url.protocol}//${url.hostname}`;
        if (!sources.includes(origin)) {
          sources.push(origin);
        }
      } catch {
        // Invalid URL, skip
      }
    });

    return sources;
  }

  /**
   * Generates CSP style-src directive for allowed third parties
   */
  generateStyleSrcDirective(): string[] {
    const sources = ["'self'", "'unsafe-inline'"]; // unsafe-inline often needed for CSS-in-JS

    // Add allowed domains
    this.config.allowedDomains.forEach(domain => {
      sources.push(`https://${domain}`);
      sources.push(`https://*.${domain}`);
    });

    // Add specific style sources
    this.config.allowedStyles.forEach(style => {
      try {
        const url = new URL(style.href);
        const origin = `${url.protocol}//${url.hostname}`;
        if (!sources.includes(origin)) {
          sources.push(origin);
        }
      } catch {
        // Invalid URL, skip
      }
    });

    return sources;
  }

  /**
   * Generates CSP img-src directive for allowed third parties
   */
  generateImgSrcDirective(): string[] {
    const sources = ["'self'", 'data:', 'blob:'];

    this.config.allowedImages.forEach(pattern => {
      if (pattern.startsWith('https://')) {
        try {
          const url = new URL(pattern);
          sources.push(`${url.protocol}//${url.hostname}`);
        } catch {
          sources.push(pattern);
        }
      } else {
        sources.push(pattern);
      }
    });

    return sources;
  }
}

// Global instances
export const defaultSRIManager = new SRIManager();
export const defaultThirdPartyManager = new ThirdPartyScriptManager();
export const defaultCSPHelper = new CSPThirdPartyHelper();

// Convenience functions
export async function loadSecureScript(src: string, options?: Parameters<ThirdPartyScriptManager['loadScript']>[1]): Promise<boolean> {
  return await defaultThirdPartyManager.loadScript(src, options);
}

export async function loadSecureStylesheet(href: string, options?: Parameters<ThirdPartyScriptManager['loadStylesheet']>[1]): Promise<boolean> {
  return await defaultThirdPartyManager.loadStylesheet(href, options);
}

export function preloadSecureResource(href: string, as: 'script' | 'style' | 'font' | 'image', options?: Parameters<ThirdPartyScriptManager['preloadResource']>[2]): void {
  defaultThirdPartyManager.preloadResource(href, as, options);
}

export async function generateSRIHash(content: string, algorithm?: 'sha256' | 'sha384' | 'sha512'): Promise<string> {
  return await defaultSRIManager.generateSRIHash(content, algorithm);
}