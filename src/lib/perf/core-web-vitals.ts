/**
 * Core Web Vitals Performance Monitoring
 * 
 * Tracks and reports Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms  
 * - CLS (Cumulative Layout Shift): < 0.1
 * - INP (Interaction to Next Paint): < 200ms
 * - TTFB (Time to First Byte)
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
  id: string;
  navigationType: string;
}

export interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: WebVitalMetric[];
  deviceInfo: {
    connection?: string;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
}

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 }
} as const;

// Metric rating helper
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Device and connection info
function getDeviceInfo() {
  const nav = navigator as any;
  return {
    connection: nav.connection?.effectiveType || 'unknown',
    deviceMemory: nav.deviceMemory || undefined,
    hardwareConcurrency: nav.hardwareConcurrency || undefined
  };
}

// Analytics reporting function (can be customized)
let analyticsReporter: (report: PerformanceReport) => void = () => {};

export function setPerformanceReporter(reporter: (report: PerformanceReport) => void) {
  analyticsReporter = reporter;
}

// Core Web Vitals tracking
export function initCoreWebVitals() {
  const metrics: WebVitalMetric[] = [];
  
  const addMetric = (metric: any) => {
    const webVitalMetric: WebVitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: getRating(metric.name, metric.value),
      delta: metric.delta,
      entries: metric.entries,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate'
    };
    
    metrics.push(webVitalMetric);
    
    // Send individual metric for real-time monitoring
    sendMetricToAnalytics(webVitalMetric);
  };

  // Track all Core Web Vitals
  onCLS(addMetric);
  onFID(addMetric);
  onFCP(addMetric);
  onLCP(addMetric);
  onTTFB(addMetric);
  
  // Track INP (Interaction to Next Paint) for modern browsers
  if ('onINP' in window) {
    onINP(addMetric);
  }

  // Send complete report when page is hidden
  const sendCompleteReport = () => {
    if (metrics.length === 0) return;
    
    const report: PerformanceReport = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: [...metrics],
      deviceInfo: getDeviceInfo()
    };
    
    analyticsReporter(report);
  };

  // Send report on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendCompleteReport();
    }
  });

  // Send report on beforeunload as fallback
  window.addEventListener('beforeunload', sendCompleteReport);
}

// Send individual metrics for real-time monitoring
function sendMetricToAnalytics(metric: WebVitalMetric) {
  // Send to analytics service immediately for real-time alerts
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'web_vitals', {
      event_category: 'Performance',
      event_label: metric.name,
      value: Math.round(metric.value),
      custom_map: {
        metric_rating: metric.rating,
        metric_delta: metric.delta
      }
    });
  }

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : 
                  metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
  }
}

// Performance observer for custom metrics
export class PerformanceMonitor {
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initResourceTiming();
    this.initNavigationTiming();
    this.initUserTiming();
  }

  private initResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.trackResourcePerformance(entry as PerformanceResourceTiming);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Resource timing observer not supported');
    }
  }

  private initNavigationTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackNavigationPerformance(entry as PerformanceNavigationTiming);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Navigation timing observer not supported');
    }
  }

  private initUserTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.trackUserTiming(entry as PerformanceMeasure);
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('User timing observer not supported');
    }
  }

  private trackResourcePerformance(entry: PerformanceResourceTiming) {
    // Track slow resources (> 1s)
    if (entry.duration > 1000) {
      console.warn(`Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'slow_resource', {
          event_category: 'Performance',
          event_label: entry.name,
          value: Math.round(entry.duration)
        });
      }
    }

    // Track failed resources
    if (entry.transferSize === 0 && entry.decodedBodySize === 0) {
      console.error(`Failed to load resource: ${entry.name}`);
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'resource_error', {
          event_category: 'Performance',
          event_label: entry.name
        });
      }
    }
  }

  private trackNavigationPerformance(entry: PerformanceNavigationTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      domParsing: entry.domContentLoadedEventStart - entry.responseEnd,
      domComplete: entry.domComplete - entry.domContentLoadedEventStart
    };

    if (process.env.NODE_ENV === 'development') {
      console.table(metrics);
    }

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      Object.entries(metrics).forEach(([name, value]) => {
        window.gtag('event', 'navigation_timing', {
          event_category: 'Performance',
          event_label: name,
          value: Math.round(value)
        });
      });
    }
  }

  private trackUserTiming(entry: PerformanceMeasure) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`User timing: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
    }

    // Send custom timing to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'user_timing', {
        event_category: 'Performance',
        event_label: entry.name,
        value: Math.round(entry.duration)
      });
    }
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Custom timing marks for key events
export function markPerformance(name: string) {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

export function measurePerformance(name: string, startMark: string, endMark?: string) {
  if ('performance' in window && 'measure' in performance) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
    } catch (e) {
      console.warn(`Performance measurement failed: ${name}`, e);
    }
  }
}

// Performance budget monitoring
export interface PerformanceBudget {
  lcp: number;
  fid: number;
  cls: number;
  inp: number;
  bundleSize: number;
  imageSize: number;
}

export const PERFORMANCE_BUDGETS: PerformanceBudget = {
  lcp: 2500,      // 2.5s
  fid: 100,       // 100ms
  cls: 0.1,       // 0.1
  inp: 200,       // 200ms
  bundleSize: 250, // 250KB
  imageSize: 500   // 500KB
};

export function checkPerformanceBudget(metrics: WebVitalMetric[]): boolean {
  const budgetViolations: string[] = [];

  metrics.forEach(metric => {
    const budgetKey = metric.name.toLowerCase() as keyof PerformanceBudget;
    const budget = PERFORMANCE_BUDGETS[budgetKey];
    
    if (budget && metric.value > budget) {
      budgetViolations.push(`${metric.name}: ${metric.value} > ${budget}`);
    }
  });

  if (budgetViolations.length > 0) {
    console.warn('Performance budget violations:', budgetViolations);
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'budget_violation', {
        event_category: 'Performance',
        event_label: budgetViolations.join(', ')
      });
    }
    
    return false;
  }

  return true;
}

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}