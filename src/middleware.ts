/**
 * Marketing Performance & Analytics Middleware
 * 
 * Handles performance monitoring, analytics, and A/B testing
 * for marketing pages at the request level.
 * 
 * Features:
 * - Performance monitoring and budgets
 * - A/B test variant assignment
 * - Analytics event tracking
 * - Security headers for performance
 * - Cache control optimization
 */

import type { NextRequest, NextResponse } from 'next/server';
import { NextResponse as Response } from 'next/server';

// Marketing pages configuration
const MARKETING_PAGES = [
  '/',
  '/features',
  '/solutions', 
  '/pricing',
  '/resources',
  '/company',
  '/contact'
];

// Performance and security headers
const PERFORMANCE_HEADERS = {
  // DNS prefetching for external resources
  'X-DNS-Prefetch-Control': 'on',
  
  // Enable browser features for performance
  'Accept-CH': 'DPR, Width, Viewport-Width, Device-Memory, RTT, Downlink',
  
  // Security headers that improve performance
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy (performance optimized)
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' 
      https://www.googletagmanager.com 
      https://www.google-analytics.com
      https://connect.facebook.net;
    style-src 'self' 'unsafe-inline' 
      https://fonts.googleapis.com;
    font-src 'self' 
      https://fonts.gstatic.com;
    img-src 'self' data: blob:
      https://www.googletagmanager.com
      https://www.google-analytics.com;
    connect-src 'self'
      https://www.google-analytics.com
      https://analytics.google.com;
    frame-src 'none';
  `.replace(/\s+/g, ' ').trim()
};

// Cache control for different asset types
const CACHE_HEADERS = {
  // Static assets - long cache
  static: 'public, max-age=31536000, immutable', // 1 year
  
  // Marketing pages - short cache with validation
  marketing: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400', // 5min/1hr/1day
  
  // API responses - no cache
  api: 'no-store, no-cache, must-revalidate',
  
  // Dynamic content - validate
  dynamic: 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600' // 5min/1hr
};

// A/B test configuration
interface ABTestConfig {
  id: string;
  trafficAllocation: number; // 0-100
  variants: Array<{
    id: string;
    weight: number; // 0-100
  }>;
}

const AB_TESTS: ABTestConfig[] = [
  {
    id: 'hero_cta_text',
    trafficAllocation: 50,
    variants: [
      { id: 'control', weight: 34 },
      { id: 'variant_a', weight: 33 },
      { id: 'variant_b', weight: 33 }
    ]
  },
  {
    id: 'pricing_layout', 
    trafficAllocation: 30,
    variants: [
      { id: 'control', weight: 50 },
      { id: 'two_column', weight: 50 }
    ]
  }
];

/**
 * Generate user hash for consistent A/B test assignment
 */
function generateUserHash(request: NextRequest): number {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
  const userAgent = request.headers.get('user-agent') || '';
  const date = new Date().toDateString(); // Daily rotation
  
  const fingerprint = `${ip}|${userAgent}|${date}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Normalize to 0-1 range
  return Math.abs(hash) / Math.pow(2, 31);
}

/**
 * Assign A/B test variants
 */
function assignABTestVariants(userHash: number): Record<string, string> {
  const assignments: Record<string, string> = {};
  
  AB_TESTS.forEach(test => {
    // Check if user is in test traffic
    if (userHash * 100 > test.trafficAllocation) {
      assignments[test.id] = 'control';
      return;
    }
    
    // Assign variant based on weights
    let cumulativeWeight = 0;
    const normalizedHash = (userHash * 100) % test.trafficAllocation;
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight * (test.trafficAllocation / 100);
      if (normalizedHash <= cumulativeWeight) {
        assignments[test.id] = variant.id;
        break;
      }
    }
    
    // Fallback to control
    if (!assignments[test.id]) {
      assignments[test.id] = 'control';
    }
  });
  
  return assignments;
}

/**
 * Set performance cookies for tracking
 */
function setPerformanceCookies(response: NextResponse, assignments: Record<string, string>) {
  // Set A/B test assignments as cookies
  Object.entries(assignments).forEach(([testId, variantId]) => {
    response.cookies.set(`ab_test_${testId}`, variantId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false, // Accessible to client-side
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  });
  
  // Set performance monitoring cookie
  response.cookies.set('perf_monitoring', 'enabled', {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  // Mark as returning visitor
  if (!response.cookies.get('ttt_returning_visitor')) {
    response.cookies.set('ttt_returning_visitor', 'true', {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
}

/**
 * Get cache control header for request
 */
function getCacheControl(pathname: string): string {
  // Static assets
  if (pathname.match(/\.(js|css|woff|woff2|jpg|jpeg|png|gif|webp|svg|avif|ico)$/)) {
    return CACHE_HEADERS.static;
  }
  
  // Marketing pages
  if (MARKETING_PAGES.includes(pathname) || pathname === '/') {
    return CACHE_HEADERS.marketing;
  }
  
  // API routes
  if (pathname.startsWith('/api/')) {
    return CACHE_HEADERS.api;
  }
  
  // Default dynamic content
  return CACHE_HEADERS.dynamic;
}

/**
 * Add resource hints for performance
 */
function addResourceHints(response: NextResponse, pathname: string) {
  // Add Link headers for resource hints
  const hints: string[] = [];
  
  // Always preconnect to Google Analytics
  hints.push('<https://www.google-analytics.com>; rel=preconnect');
  hints.push('<https://www.googletagmanager.com>; rel=preconnect');
  
  // Preload critical fonts
  if (MARKETING_PAGES.includes(pathname)) {
    hints.push('</fonts/inter-regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin');
    
    // Homepage gets additional preloads
    if (pathname === '/') {
      hints.push('</fonts/inter-bold.woff2>; rel=preload; as=font; type=font/woff2; crossorigin');
      hints.push('</images/hero-bg.webp>; rel=preload; as=image');
    }
  }
  
  if (hints.length > 0) {
    response.headers.set('Link', hints.join(', '));
  }
}

/**
 * Track performance metrics in headers
 */
function addPerformanceHeaders(response: NextResponse, request: NextRequest) {
  const startTime = Date.now();
  
  // Add server timing headers
  response.headers.set('Server-Timing', `middleware;dur=${Date.now() - startTime}`);
  
  // Add performance hints
  response.headers.set('X-Performance-Budget', JSON.stringify({
    lcp: 2500,
    fcp: 1800,
    cls: 0.1,
    bundle: 250000
  }));
  
  // Add client hints for adaptive loading
  response.headers.set('Accept-CH', 'DPR, Width, Viewport-Width, Device-Memory, RTT, Downlink');
  response.headers.set('Accept-CH-Lifetime', '86400'); // 24 hours
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  
  // Skip non-marketing pages
  const isMarketingPage = MARKETING_PAGES.includes(pathname) || pathname === '/';
  if (!isMarketingPage && !pathname.startsWith('/api/')) {
    return Response.next();
  }
  
  // Create response
  const response = Response.next();
  
  // Add performance and security headers
  Object.entries(PERFORMANCE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Set cache control
  const cacheControl = getCacheControl(pathname);
  response.headers.set('Cache-Control', cacheControl);
  
  // Add resource hints
  addResourceHints(response, pathname);
  
  // Add performance tracking headers
  addPerformanceHeaders(response, request);
  
  // Handle A/B testing for marketing pages
  if (isMarketingPage) {
    const userHash = generateUserHash(request);
    const abAssignments = assignABTestVariants(userHash);
    
    // Set cookies for client-side access
    setPerformanceCookies(response, abAssignments);
    
    // Add A/B test info to headers for debugging
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-AB-Tests', JSON.stringify(abAssignments));
      response.headers.set('X-User-Hash', userHash.toString());
    }
  }
  
  // Analytics headers for marketing pages
  if (isMarketingPage) {
    response.headers.set('X-Page-Type', 'marketing');
    response.headers.set('X-Analytics-Enabled', 'true');
    
    // Add performance monitoring flag
    response.headers.set('X-Performance-Monitoring', 'enabled');
  }
  
  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Add timing header
  const processingTime = Date.now() - startTime;
  response.headers.set('X-Middleware-Time', `${processingTime}ms`);
  
  return response;
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /app (authenticated app routes - outside our scope)
     */
    '/((?!_next/static|_next/image|favicon.ico|app).*)',
  ],
};

// Export types for use in other files
export type { ABTestConfig };
export { MARKETING_PAGES, PERFORMANCE_HEADERS, CACHE_HEADERS };