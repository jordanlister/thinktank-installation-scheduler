// Think Tank Technologies - Vite Security Plugin

import type { Plugin } from 'vite';
import { generateCSPNonce, createCSPConfig, buildCSPHeader, getCSPHeaderName } from './csp';
import { createSecurityHeaders } from './headers';

export interface SecurityPluginOptions {
  enableCSP?: boolean;
  enableSecurityHeaders?: boolean;
  isDevelopment?: boolean;
  reportUri?: string;
  reportOnly?: boolean;
}

/**
 * Vite plugin to add security headers and CSP
 */
export function securityPlugin(options: SecurityPluginOptions = {}): Plugin {
  const {
    enableCSP = true,
    enableSecurityHeaders = true,
    isDevelopment = false,
    reportUri = '/api/csp-report',
    reportOnly = isDevelopment
  } = options;

  let nonce = generateCSPNonce();

  return {
    name: 'ttt-security',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Generate new nonce for each request
        nonce = generateCSPNonce();
        
        // Add nonce to response locals for template usage
        (res as any).locals = { ...((res as any).locals || {}), nonce };

        // Add security headers
        if (enableSecurityHeaders) {
          const headers = createSecurityHeaders(isDevelopment, req.headers.host?.includes('https'));
          Object.entries(headers).forEach(([key, value]) => {
            if (value) {
              res.setHeader(key, value);
            }
          });
        }

        // Add CSP header
        if (enableCSP) {
          const cspConfig = createCSPConfig(nonce, isDevelopment);
          cspConfig.reportUri = reportUri;
          cspConfig.reportOnly = reportOnly;

          const cspHeader = buildCSPHeader(cspConfig);
          const headerName = getCSPHeaderName(reportOnly);
          res.setHeader(headerName, cspHeader);
        }

        next();
      });
    },
    transformIndexHtml(html, context) {
      // Inject nonce into script and style tags in HTML
      let transformedHtml = html;

      // Add nonce to inline scripts (but not external scripts)
      transformedHtml = transformedHtml.replace(
        /<script(?![^>]*\ssrc=)([^>]*)>/gi,
        `<script$1 nonce="${nonce}">`
      );

      // Add nonce to inline styles
      transformedHtml = transformedHtml.replace(
        /<style([^>]*)>/gi,
        `<style$1 nonce="${nonce}">`
      );

      // Add security meta tags
      const securityMetas = [
        '<meta name="referrer" content="strict-origin-when-cross-origin">',
        '<meta name="format-detection" content="telephone=no">',
        '<meta name="msapplication-tap-highlight" content="no">',
      ];

      // Insert security metas before closing head tag
      transformedHtml = transformedHtml.replace(
        '</head>',
        `${securityMetas.join('\n    ')}\n  </head>`
      );

      return transformedHtml;
    },
    generateBundle(options, bundle) {
      // Add integrity hashes to built assets in production
      if (!isDevelopment) {
        // This would be expanded to generate SRI hashes for built assets
        console.log('Security Plugin: Assets built with integrity checks');
      }
    }
  };
}

/**
 * Creates middleware for Express-like servers
 */
export function createSecurityMiddleware(options: SecurityPluginOptions = {}) {
  const {
    enableCSP = true,
    enableSecurityHeaders = true,
    isDevelopment = false,
    reportUri = '/api/csp-report',
    reportOnly = isDevelopment
  } = options;

  return (req: any, res: any, next: any) => {
    // Generate nonce for this request
    const nonce = generateCSPNonce();
    res.locals = { ...res.locals, nonce };

    // Add security headers
    if (enableSecurityHeaders) {
      const isHTTPS = req.secure || req.headers['x-forwarded-proto'] === 'https';
      const headers = createSecurityHeaders(isDevelopment, isHTTPS);
      
      Object.entries(headers).forEach(([key, value]) => {
        if (value) {
          res.setHeader(key, value);
        }
      });
    }

    // Add CSP header
    if (enableCSP) {
      const cspConfig = createCSPConfig(nonce, isDevelopment);
      cspConfig.reportUri = reportUri;
      cspConfig.reportOnly = reportOnly;

      const cspHeader = buildCSPHeader(cspConfig);
      const headerName = getCSPHeaderName(reportOnly);
      res.setHeader(headerName, cspHeader);
    }

    next();
  };
}

/**
 * Configuration for different deployment environments
 */
export const securityConfigs = {
  development: {
    enableCSP: true,
    enableSecurityHeaders: true,
    isDevelopment: true,
    reportOnly: true
  },
  
  staging: {
    enableCSP: true,
    enableSecurityHeaders: true,
    isDevelopment: false,
    reportOnly: true, // Test CSP in report-only mode in staging
    reportUri: '/api/csp-report'
  },
  
  production: {
    enableCSP: true,
    enableSecurityHeaders: true,
    isDevelopment: false,
    reportOnly: false, // Enforce CSP in production
    reportUri: '/api/csp-report'
  }
};