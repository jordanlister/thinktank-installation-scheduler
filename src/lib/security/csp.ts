// Think Tank Technologies - Content Security Policy Implementation

import type { CSPConfig } from './types';

/**
 * Generates a cryptographically secure nonce for CSP
 */
export function generateCSPNonce(): string {
  // Use crypto.getRandomValues if available, fallback for environments without it
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '');
  }
  
  // Fallback for environments without crypto API
  return btoa(Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15)).replace(/[+/=]/g, '');
}

/**
 * Creates a comprehensive CSP configuration for the marketing site
 */
export function createCSPConfig(nonce: string, isDevelopment: boolean = false): CSPConfig {
  const config: CSPConfig = {
    nonce,
    reportUri: '/api/csp-report', // Will need to implement this endpoint
    reportOnly: isDevelopment, // Use report-only mode in development
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        `'nonce-${nonce}'`,
        // Google Analytics and Tag Manager
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://ssl.google-analytics.com',
        // Vercel Analytics (if used)
        'https://vitals.vercel-analytics.com',
        // Only allow specific inline scripts with nonce
        ...(isDevelopment ? ["'unsafe-eval'"] : [])
      ],
      'style-src': [
        "'self'",
        `'nonce-${nonce}'`,
        "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
        // Google Fonts
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:', // For inline SVGs and base64 images
        'blob:', // For dynamically generated images
        // CDNs and external images
        'https://images.unsplash.com',
        'https://via.placeholder.com',
        'https://placeimg.com',
        // Analytics pixels
        'https://www.google-analytics.com',
        'https://stats.g.doubleclick.net'
      ],
      'font-src': [
        "'self'",
        'data:', // For base64 fonts
        // Google Fonts
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ],
      'connect-src': [
        "'self'",
        // Supabase
        process.env.VITE_SUPABASE_URL || 'https://*.supabase.co',
        // Analytics
        'https://www.google-analytics.com',
        'https://analytics.google.com',
        // Vercel
        'https://vitals.vercel-analytics.com',
        // WebSocket connections
        'wss://*.supabase.co',
        ...(isDevelopment ? ['ws://localhost:3000', 'http://localhost:3000', 'ws://localhost:3001'] : [])
      ],
      'frame-src': [
        // YouTube embeds for demo videos
        'https://www.youtube.com',
        'https://youtube.com',
        // Vimeo embeds
        'https://player.vimeo.com',
        // Google Maps (if needed)
        'https://www.google.com'
      ],
      'media-src': [
        "'self'",
        'blob:', // For media streams
        // CDN for videos
        'https://cdn.thinktanktechnologies.com',
        'https://vimeo.com',
        'https://youtube.com'
      ],
      'object-src': ["'none'"], // Disable plugins
      'child-src': [
        "'self'",
        'blob:', // For workers
        'https://www.youtube.com',
        'https://player.vimeo.com'
      ],
      'worker-src': [
        "'self'",
        'blob:' // For service workers
      ],
      'manifest-src': ["'self'"],
      'form-action': [
        "'self'",
        // Only allow forms to submit to our own domain
      ],
      'frame-ancestors': ["'none'"], // Prevent clickjacking
      'base-uri': ["'self'"], // Prevent base tag injection
      'upgrade-insecure-requests': !isDevelopment, // Only in production
      'block-all-mixed-content': !isDevelopment // Only in production
    }
  };

  return config;
}

/**
 * Converts CSP config to header string
 */
export function buildCSPHeader(config: CSPConfig): string {
  const directives: string[] = [];

  Object.entries(config.directives).forEach(([directive, values]) => {
    if (directive === 'upgrade-insecure-requests' || directive === 'block-all-mixed-content') {
      if (values === true) {
        directives.push(directive.replace(/([A-Z])/g, '-$1').toLowerCase());
      }
    } else if (Array.isArray(values) && values.length > 0) {
      const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
      directives.push(`${directiveName} ${values.join(' ')}`);
    }
  });

  if (config.reportUri) {
    directives.push(`report-uri ${config.reportUri}`);
  }

  return directives.join('; ');
}

/**
 * Gets the appropriate CSP header name based on report mode
 */
export function getCSPHeaderName(reportOnly: boolean = false): string {
  return reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
}

/**
 * Validates if a URL is allowed by CSP directives
 */
export function validateCSPSource(url: string, directive: string, config: CSPConfig): boolean {
  const sources = config.directives[directive as keyof typeof config.directives];
  
  if (!Array.isArray(sources)) {
    return false;
  }

  // Self is always allowed for same-origin
  if (sources.includes("'self'") && new URL(url).origin === window.location.origin) {
    return true;
  }

  // Check exact matches
  if (sources.includes(url)) {
    return true;
  }

  // Check wildcard domains
  for (const source of sources) {
    if (source.includes('*')) {
      const pattern = source.replace(/\*/g, '.*');
      if (new RegExp(`^${pattern}$`).test(url)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Reports CSP violations
 */
export function reportCSPViolation(violation: any): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('CSP Violation:', violation);
  }

  // Send to monitoring service in production
  if (typeof fetch !== 'undefined') {
    fetch('/api/csp-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'csp-report': violation
      })
    }).catch(error => {
      console.error('Failed to report CSP violation:', error);
    });
  }
}

/**
 * Sets up CSP violation reporting
 */
export function setupCSPReporting(): void {
  if (typeof document !== 'undefined') {
    document.addEventListener('securitypolicyviolation', (event) => {
      reportCSPViolation({
        'blocked-uri': event.blockedURI,
        'document-uri': event.documentURI,
        'effective-directive': event.effectiveDirective,
        'original-policy': event.originalPolicy,
        'referrer': event.referrer,
        'violated-directive': event.violatedDirective,
        'source-file': event.sourceFile,
        'line-number': event.lineNumber,
        'column-number': event.columnNumber,
        'status-code': event.statusCode
      });
    });
  }
}

/**
 * Injects nonce into script and style tags
 */
export function injectNonce(html: string, nonce: string): string {
  // Add nonce to script tags without src
  html = html.replace(
    /<script(?![^>]*\ssrc=)([^>]*)>/gi,
    `<script$1 nonce="${nonce}">`
  );

  // Add nonce to inline style tags
  html = html.replace(
    /<style([^>]*)>/gi,
    `<style$1 nonce="${nonce}">`
  );

  return html;
}

/**
 * Creates a CSP-compliant script loader
 */
export function loadScript(src: string, nonce: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.nonce = nonce;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Creates a CSP-compliant style loader
 */
export function loadStyle(href: string, nonce: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.nonce = nonce;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
}

// Default CSP configuration
export const DEFAULT_CSP_CONFIG = createCSPConfig(generateCSPNonce(), process.env.NODE_ENV === 'development');