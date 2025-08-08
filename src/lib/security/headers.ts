// Think Tank Technologies - Security Headers Implementation

import type { SecurityHeaders } from './types';

/**
 * Creates comprehensive security headers for the marketing site
 */
export function createSecurityHeaders(isDevelopment: boolean = false, isHTTPS: boolean = true): SecurityHeaders {
  return {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // XSS Protection (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',
    
    // HTTPS Strict Transport Security
    'Strict-Transport-Security': isHTTPS && !isDevelopment 
      ? 'max-age=31536000; includeSubDomains; preload'
      : '', // Don't set HSTS in development or HTTP
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Feature permissions policy
    'Permissions-Policy': [
      'accelerometer=()',        // Disable accelerometer
      'ambient-light-sensor=()', // Disable ambient light sensor
      'autoplay=(self)',         // Allow autoplay only from same origin
      'battery=()',              // Disable battery API
      'camera=()',               // Disable camera
      'cross-origin-isolated=(self)', // Control cross-origin isolation
      'display-capture=()',      // Disable display capture
      'document-domain=()',      // Disable document.domain
      'encrypted-media=()',      // Disable encrypted media
      'execution-while-not-rendered=()', // Control execution
      'execution-while-out-of-viewport=()', // Control execution
      'fullscreen=(self)',       // Allow fullscreen only from same origin
      'geolocation=()',          // Disable geolocation
      'gyroscope=()',            // Disable gyroscope
      'magnetometer=()',         // Disable magnetometer
      'microphone=()',           // Disable microphone
      'midi=()',                 // Disable MIDI
      'navigation-override=()',  // Disable navigation override
      'payment=()',              // Disable payment API
      'picture-in-picture=()',   // Disable picture-in-picture
      'publickey-credentials-get=()', // Disable WebAuthn
      'screen-wake-lock=()',     // Disable screen wake lock
      'sync-xhr=(self)',         // Allow sync XHR only from same origin
      'usb=()',                  // Disable USB API
      'web-share=()',            // Disable Web Share API
      'xr-spatial-tracking=()'   // Disable XR spatial tracking
    ].join(', '),
    
    // Cross-Origin policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
    
    // Cache control for security
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    
    // DNS prefetch control
    'X-DNS-Prefetch-Control': 'off'
  };
}

/**
 * Gets security headers as a Map for easier manipulation
 */
export function getSecurityHeadersMap(isDevelopment?: boolean, isHTTPS?: boolean): Map<string, string> {
  const headers = createSecurityHeaders(isDevelopment, isHTTPS);
  return new Map(Object.entries(headers).filter(([, value]) => value !== ''));
}

/**
 * Formats security headers for different contexts
 */
export interface HeaderContext {
  type: 'vite' | 'express' | 'nginx' | 'apache' | 'cloudflare';
  isDevelopment?: boolean;
  isHTTPS?: boolean;
}

/**
 * Formats security headers for Vite dev server
 */
export function formatHeadersForVite(context: HeaderContext): Record<string, string> {
  const headers = createSecurityHeaders(context.isDevelopment, context.isHTTPS);
  
  // Remove empty headers and format for Vite
  const formatted: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      formatted[key] = value;
    }
  });
  
  return formatted;
}

/**
 * Formats security headers for Nginx configuration
 */
export function formatHeadersForNginx(context: HeaderContext): string {
  const headers = createSecurityHeaders(context.isDevelopment, context.isHTTPS);
  
  return Object.entries(headers)
    .filter(([, value]) => value)
    .map(([key, value]) => `add_header ${key} "${value}" always;`)
    .join('\n    ');
}

/**
 * Formats security headers for Apache configuration
 */
export function formatHeadersForApache(context: HeaderContext): string {
  const headers = createSecurityHeaders(context.isDevelopment, context.isHTTPS);
  
  return Object.entries(headers)
    .filter(([, value]) => value)
    .map(([key, value]) => `Header always set ${key} "${value}"`)
    .join('\n    ');
}

/**
 * Validates that security headers are properly set
 */
export function validateSecurityHeaders(responseHeaders: Record<string, string>): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const required = [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy'
  ];
  
  const recommended = [
    'Strict-Transport-Security',
    'Permissions-Policy',
    'Cross-Origin-Embedder-Policy',
    'Cross-Origin-Opener-Policy'
  ];
  
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required headers
  required.forEach(header => {
    if (!responseHeaders[header]) {
      missing.push(header);
    }
  });
  
  // Check recommended headers
  recommended.forEach(header => {
    if (!responseHeaders[header]) {
      warnings.push(`Recommended header missing: ${header}`);
    }
  });
  
  // Validate specific header values
  if (responseHeaders['X-Content-Type-Options'] !== 'nosniff') {
    warnings.push('X-Content-Type-Options should be "nosniff"');
  }
  
  if (responseHeaders['X-Frame-Options'] !== 'DENY' && responseHeaders['X-Frame-Options'] !== 'SAMEORIGIN') {
    warnings.push('X-Frame-Options should be "DENY" or "SAMEORIGIN"');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Creates a security header testing utility
 */
export function testSecurityHeaders(url: string): Promise<{
  score: number;
  headers: Record<string, string>;
  validation: ReturnType<typeof validateSecurityHeaders>;
}> {
  if (typeof fetch === 'undefined') {
    return Promise.reject(new Error('fetch is not available'));
  }
  
  return fetch(url, { method: 'HEAD' })
    .then(response => {
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      const validation = validateSecurityHeaders(headers);
      const score = calculateSecurityScore(headers);
      
      return { score, headers, validation };
    });
}

/**
 * Calculates a security score based on headers
 */
export function calculateSecurityScore(headers: Record<string, string>): number {
  let score = 0;
  const maxScore = 100;
  
  const checks = [
    { header: 'Content-Security-Policy', weight: 25, check: (v: string) => v.length > 0 },
    { header: 'Strict-Transport-Security', weight: 15, check: (v: string) => v.includes('max-age') },
    { header: 'X-Content-Type-Options', weight: 10, check: (v: string) => v === 'nosniff' },
    { header: 'X-Frame-Options', weight: 15, check: (v: string) => ['DENY', 'SAMEORIGIN'].includes(v) },
    { header: 'X-XSS-Protection', weight: 10, check: (v: string) => v.includes('1') },
    { header: 'Referrer-Policy', weight: 10, check: (v: string) => v.length > 0 },
    { header: 'Permissions-Policy', weight: 10, check: (v: string) => v.length > 0 },
    { header: 'Cross-Origin-Embedder-Policy', weight: 5, check: (v: string) => v.length > 0 }
  ];
  
  checks.forEach(({ header, weight, check }) => {
    const value = headers[header];
    if (value && check(value)) {
      score += weight;
    }
  });
  
  return Math.min(score, maxScore);
}

/**
 * Middleware function to add security headers
 */
export function addSecurityHeaders(
  req: any, 
  res: any, 
  next: any,
  options: { isDevelopment?: boolean; isHTTPS?: boolean } = {}
) {
  const headers = createSecurityHeaders(
    options.isDevelopment ?? process.env.NODE_ENV === 'development',
    options.isHTTPS ?? req.secure ?? req.protocol === 'https'
  );
  
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      res.setHeader(key, value);
    }
  });
  
  next();
}

/**
 * Creates security headers for static file serving
 */
export function createStaticSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  };
}

// Export default security headers configuration
export const DEFAULT_SECURITY_HEADERS = createSecurityHeaders(
  process.env.NODE_ENV === 'development',
  process.env.NODE_ENV === 'production'
);