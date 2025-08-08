/**
 * Performance Testing Utilities
 * 
 * Helper functions for performance testing and Core Web Vitals measurement
 * Provides utilities for network simulation, metric collection, and analysis
 */

import { Page } from '@playwright/test';

export interface PerformanceMetrics {
  lcp?: number;          // Largest Contentful Paint
  fcp?: number;          // First Contentful Paint
  cls?: number;          // Cumulative Layout Shift
  fid?: number;          // First Input Delay
  inp?: number;          // Interaction to Next Paint
  ttfb?: number;         // Time to First Byte
  tti?: number;          // Time to Interactive
  tbt?: number;          // Total Blocking Time
  loadTime?: number;     // Full page load time
  domContentLoaded?: number; // DOM Content Loaded
}

export interface ResourceTiming {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
  blocked: boolean;
}

export interface PerformanceBudget {
  metric: keyof PerformanceMetrics;
  budget: number;
  actual?: number;
  passed?: boolean;
}

/**
 * Collect comprehensive performance metrics from a page
 */
export async function performanceMetrics(page: Page): Promise<PerformanceMetrics> {
  // Wait for page load and additional metrics collection
  await page.waitForLoadState('networkidle');
  
  return await page.evaluate(() => {
    return new Promise<PerformanceMetrics>((resolve) => {
      const metrics: PerformanceMetrics = {};
      
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.requestStart;
        metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      }
      
      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        metrics.fcp = fcp.startTime;
      }
      
      // Collect Core Web Vitals using PerformanceObserver
      let collectedMetrics = 0;
      const totalMetrics = 3; // LCP, CLS, FID/INP
      
      // LCP Observer
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lcp = entries[entries.length - 1];
          metrics.lcp = lcp.startTime;
          collectedMetrics++;
          if (collectedMetrics >= totalMetrics) resolve(metrics);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      
      // CLS Observer
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        metrics.cls = clsValue;
        collectedMetrics++;
        if (collectedMetrics >= totalMetrics) resolve(metrics);
      }).observe({ type: 'layout-shift', buffered: true });
      
      // FID/INP Observer
      if ('PerformanceEventTiming' in window) {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries() as any[];
          if (entries.length > 0) {
            // First Input Delay
            const firstInput = entries[0];
            if (firstInput.processingStart > firstInput.startTime) {
              metrics.fid = firstInput.processingStart - firstInput.startTime;
            }
            
            // Interaction to Next Paint (approximate)
            const interactions = entries.filter((entry: any) => 
              entry.name === 'click' || entry.name === 'keydown' || entry.name === 'tap'
            );
            if (interactions.length > 0) {
              const inp = Math.max(...interactions.map((entry: any) => entry.duration || 0));
              metrics.inp = inp;
            }
          }
          collectedMetrics++;
          if (collectedMetrics >= totalMetrics) resolve(metrics);
        }).observe({ type: 'event', buffered: true });
        
        // Also try to observe first-input specifically
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries() as any[];
          if (entries.length > 0) {
            const firstInput = entries[0];
            metrics.fid = firstInput.processingStart - firstInput.startTime;
          }
        }).observe({ type: 'first-input', buffered: true });
      } else {
        // Fallback if Event Timing API not supported
        collectedMetrics++;
        if (collectedMetrics >= totalMetrics) resolve(metrics);
      }
      
      // Timeout fallback
      setTimeout(() => {
        resolve(metrics);
      }, 5000);
    });
  });
}

/**
 * Wait for specific load state with timeout
 */
export async function waitForLoadState(
  page: Page, 
  state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle',
  timeout: number = 30000
): Promise<void> {
  try {
    await page.waitForLoadState(state, { timeout });
  } catch (error) {
    console.warn(`Timeout waiting for ${state} state after ${timeout}ms`);
  }
}

/**
 * Simulate slow network conditions
 */
export async function simulateSlowNetwork(page: Page): Promise<void> {
  // Simulate slow 3G connection
  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 500 * 1024 / 8, // 500 Kbps
    uploadThroughput: 500 * 1024 / 8,   // 500 Kbps
    latency: 300 // 300ms latency
  });
}

/**
 * Simulate fast network conditions (for baseline comparison)
 */
export async function simulateFastNetwork(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 100 * 1024 * 1024 / 8, // 100 Mbps
    uploadThroughput: 100 * 1024 * 1024 / 8,   // 100 Mbps
    latency: 20 // 20ms latency
  });
}

/**
 * Get detailed resource timing information
 */
export async function getResourceTiming(page: Page): Promise<ResourceTiming[]> {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.map(resource => {
      const url = new URL(resource.name);
      const extension = url.pathname.split('.').pop() || '';
      
      let type = 'other';
      if (extension.match(/js/)) type = 'script';
      else if (extension.match(/css/)) type = 'stylesheet';
      else if (extension.match(/(jpg|jpeg|png|gif|webp|svg|avif)/)) type = 'image';
      else if (extension.match(/(woff|woff2|ttf|otf)/)) type = 'font';
      
      return {
        name: resource.name,
        type,
        size: resource.transferSize || resource.encodedBodySize || 0,
        duration: resource.duration,
        startTime: resource.startTime,
        blocked: resource.duration > 1000 // Consider >1s as blocked
      };
    });
  });
}

/**
 * Measure Time to Interactive (TTI)
 */
export async function measureTTI(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      // Simple TTI approximation
      // TTI is when the page is visually loaded and can respond to user input
      
      let tti = 0;
      const startTime = performance.timing.navigationStart;
      
      // Use load event as baseline
      if (document.readyState === 'complete') {
        tti = performance.timing.loadEventEnd - startTime;
        resolve(tti);
      } else {
        window.addEventListener('load', () => {
          // Wait for main thread to be idle
          setTimeout(() => {
            tti = performance.now();
            resolve(tti);
          }, 100);
        });
      }
      
      // Timeout fallback
      setTimeout(() => {
        tti = performance.now();
        resolve(tti);
      }, 10000);
    });
  });
}

/**
 * Measure Total Blocking Time (TBT)
 */
export async function measureTBT(page: Page): Promise<number> {
  return await page.evaluate(() => {
    // TBT is the sum of blocking time for all long tasks
    let tbt = 0;
    
    if ('PerformanceLongTaskTiming' in window) {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > 50) {
            tbt += entry.duration - 50;
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long Task API not supported
        console.warn('Long Task API not supported');
      }
    }
    
    return tbt;
  });
}

/**
 * Check performance budgets
 */
export function checkPerformanceBudgets(
  metrics: PerformanceMetrics,
  budgets: PerformanceBudget[]
): PerformanceBudget[] {
  return budgets.map(budget => {
    const actual = metrics[budget.metric];
    return {
      ...budget,
      actual,
      passed: actual !== undefined ? actual <= budget.budget : undefined
    };
  });
}

/**
 * Generate performance score (0-100) based on Core Web Vitals
 */
export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  let validMetrics = 0;
  
  // LCP scoring (0-25 points)
  if (metrics.lcp !== undefined) {
    validMetrics++;
    if (metrics.lcp > 4000) score -= 25;
    else if (metrics.lcp > 2500) score -= 15;
    else if (metrics.lcp > 1200) score -= 5;
  }
  
  // FCP scoring (0-15 points)
  if (metrics.fcp !== undefined) {
    validMetrics++;
    if (metrics.fcp > 3000) score -= 15;
    else if (metrics.fcp > 1800) score -= 10;
    else if (metrics.fcp > 1000) score -= 3;
  }
  
  // CLS scoring (0-25 points)
  if (metrics.cls !== undefined) {
    validMetrics++;
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 15;
    else if (metrics.cls > 0.05) score -= 5;
  }
  
  // FID/INP scoring (0-25 points)
  const inputDelay = metrics.inp || metrics.fid;
  if (inputDelay !== undefined) {
    validMetrics++;
    if (inputDelay > 300) score -= 25;
    else if (inputDelay > 100) score -= 15;
    else if (inputDelay > 50) score -= 5;
  }
  
  // TTFB scoring (0-10 points)
  if (metrics.ttfb !== undefined) {
    validMetrics++;
    if (metrics.ttfb > 2000) score -= 10;
    else if (metrics.ttfb > 800) score -= 5;
    else if (metrics.ttfb > 400) score -= 2;
  }
  
  // If no metrics available, return 0
  if (validMetrics === 0) return 0;
  
  return Math.max(0, Math.round(score));
}

/**
 * Get performance insights and recommendations
 */
export function getPerformanceInsights(
  metrics: PerformanceMetrics,
  resources: ResourceTiming[]
): string[] {
  const insights: string[] = [];
  
  // LCP insights
  if (metrics.lcp && metrics.lcp > 2500) {
    insights.push('⚠️ LCP is above 2.5s target - consider optimizing largest element');
    
    const largeImages = resources.filter(r => r.type === 'image' && r.size > 500000);
    if (largeImages.length > 0) {
      insights.push('💡 Large images detected - consider compression and modern formats');
    }
  }
  
  // CLS insights
  if (metrics.cls && metrics.cls > 0.1) {
    insights.push('⚠️ CLS is above 0.1 target - check for layout shifts during loading');
    insights.push('💡 Consider reserving space for images and ads to prevent shifts');
  }
  
  // FCP insights
  if (metrics.fcp && metrics.fcp > 1800) {
    insights.push('⚠️ FCP is slow - consider optimizing render-blocking resources');
    
    const blockingScripts = resources.filter(r => r.type === 'script' && r.blocked);
    if (blockingScripts.length > 0) {
      insights.push('💡 Render-blocking scripts detected - consider async/defer loading');
    }
  }
  
  // Bundle size insights
  const jsSize = resources.filter(r => r.type === 'script').reduce((sum, r) => sum + r.size, 0);
  if (jsSize > 250000) {
    insights.push('⚠️ JavaScript bundle is large - consider code splitting');
  }
  
  // Caching insights
  const slowResources = resources.filter(r => r.duration > 1000);
  if (slowResources.length > 0) {
    insights.push('💡 Some resources are loading slowly - check caching and CDN usage');
  }
  
  // TTFB insights
  if (metrics.ttfb && metrics.ttfb > 800) {
    insights.push('⚠️ TTFB is slow - consider server optimization or CDN');
  }
  
  return insights;
}

/**
 * Format performance metrics for reporting
 */
export function formatPerformanceReport(
  url: string,
  metrics: PerformanceMetrics,
  resources: ResourceTiming[],
  insights: string[]
): string {
  let report = `# Performance Report\n\n`;
  report += `**URL**: ${url}\n`;
  report += `**Timestamp**: ${new Date().toISOString()}\n`;
  report += `**Score**: ${calculatePerformanceScore(metrics)}/100\n\n`;
  
  report += `## Core Web Vitals\n\n`;
  
  if (metrics.lcp) {
    const lcpStatus = metrics.lcp <= 2500 ? '✅' : '❌';
    report += `- **LCP**: ${metrics.lcp.toFixed(0)}ms ${lcpStatus}\n`;
  }
  
  if (metrics.fcp) {
    const fcpStatus = metrics.fcp <= 1800 ? '✅' : '❌';
    report += `- **FCP**: ${metrics.fcp.toFixed(0)}ms ${fcpStatus}\n`;
  }
  
  if (metrics.cls !== undefined) {
    const clsStatus = metrics.cls <= 0.1 ? '✅' : '❌';
    report += `- **CLS**: ${metrics.cls.toFixed(3)} ${clsStatus}\n`;
  }
  
  if (metrics.fid) {
    const fidStatus = metrics.fid <= 100 ? '✅' : '❌';
    report += `- **FID**: ${metrics.fid.toFixed(0)}ms ${fidStatus}\n`;
  }
  
  if (metrics.ttfb) {
    const ttfbStatus = metrics.ttfb <= 800 ? '✅' : '❌';
    report += `- **TTFB**: ${metrics.ttfb.toFixed(0)}ms ${ttfbStatus}\n`;
  }
  
  report += `\n## Resource Analysis\n\n`;
  
  const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
  const jsSize = resources.filter(r => r.type === 'script').reduce((sum, r) => sum + r.size, 0);
  const cssSize = resources.filter(r => r.type === 'stylesheet').reduce((sum, r) => sum + r.size, 0);
  const imageSize = resources.filter(r => r.type === 'image').reduce((sum, r) => sum + r.size, 0);
  
  report += `- **Total Size**: ${formatBytes(totalSize)}\n`;
  report += `- **JavaScript**: ${formatBytes(jsSize)}\n`;
  report += `- **CSS**: ${formatBytes(cssSize)}\n`;
  report += `- **Images**: ${formatBytes(imageSize)}\n`;
  report += `- **Resources**: ${resources.length}\n`;
  
  if (insights.length > 0) {
    report += `\n## Recommendations\n\n`;
    insights.forEach(insight => {
      report += `${insight}\n`;
    });
  }
  
  return report;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Default performance budgets for marketing pages
export const DEFAULT_PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { metric: 'lcp', budget: 2500 },
  { metric: 'fcp', budget: 1800 },
  { metric: 'cls', budget: 0.1 },
  { metric: 'fid', budget: 100 },
  { metric: 'ttfb', budget: 800 },
  { metric: 'loadTime', budget: 5000 }
];

// Network condition presets
export const NETWORK_CONDITIONS = {
  fast: {
    downloadThroughput: 100 * 1024 * 1024 / 8, // 100 Mbps
    uploadThroughput: 100 * 1024 * 1024 / 8,
    latency: 20
  },
  regular4G: {
    downloadThroughput: 10 * 1024 * 1024 / 8, // 10 Mbps
    uploadThroughput: 3 * 1024 * 1024 / 8,    // 3 Mbps
    latency: 50
  },
  slow3G: {
    downloadThroughput: 500 * 1024 / 8, // 500 Kbps
    uploadThroughput: 500 * 1024 / 8,
    latency: 300
  },
  slowest: {
    downloadThroughput: 100 * 1024 / 8, // 100 Kbps
    uploadThroughput: 50 * 1024 / 8,    // 50 Kbps
    latency: 1000
  }
} as const;