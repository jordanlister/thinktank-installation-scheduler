/**
 * Performance Optimization Library
 * 
 * Comprehensive performance monitoring and optimization utilities
 * for the Think Tank Technologies marketing website.
 * 
 * Features:
 * - Core Web Vitals tracking (LCP, FID, CLS, INP)
 * - Image optimization and lazy loading
 * - Bundle analysis and code splitting
 * - Performance budgets and monitoring
 */

// Core Web Vitals
export {
  initCoreWebVitals,
  setPerformanceReporter,
  PerformanceMonitor,
  markPerformance,
  measurePerformance,
  checkPerformanceBudget,
  PERFORMANCE_BUDGETS,
  type WebVitalMetric,
  type PerformanceReport,
  type PerformanceBudget
} from './core-web-vitals';

// Image Optimization
export {
  generateResponsiveImageSet,
  generateBlurPlaceholder,
  LazyImageLoader,
  getLazyImageLoader,
  preloadCriticalImages,
  supportsWebP,
  supportsAVIF,
  getOptimalFormat,
  trackImagePerformance,
  calculateResponsiveDimensions,
  DEFAULT_IMAGE_CONFIG,
  CRITICAL_IMAGES,
  IMAGE_QUALITY_PRESETS,
  IMAGE_BREAKPOINTS,
  type ImageOptimizationConfig,
  type ResponsiveImageSet,
  type OptimizedImageProps
} from './image-optimization';

// Bundle Optimization
export {
  BundleMonitor,
  CodeSplitHelper,
  TreeShakeAnalyzer,
  DynamicImportStrategies,
  PerformantModuleLoader,
  BUNDLE_OPTIMIZATION_TIPS,
  type BundleMetrics,
  type BundleAnalysisResult,
  type CodeSplitConfig,
  type ImportAnalysis,
  type TreeShakeReport
} from './bundle-optimization';

// Performance initialization for marketing pages
export function initMarketingPerformance() {
  // Initialize Core Web Vitals tracking
  initCoreWebVitals();
  
  // Initialize performance monitor
  const monitor = new PerformanceMonitor();
  
  // Preload critical images
  preloadCriticalImages(CRITICAL_IMAGES);
  
  // Mark performance milestones
  markPerformance('marketing-init-start');
  
  // Setup lazy loading for marketing images
  const lazyLoader = getLazyImageLoader();
  
  // Observe all lazy images on page
  document.querySelectorAll('img[data-src]').forEach(img => {
    lazyLoader.observe(img as HTMLImageElement);
  });
  
  markPerformance('marketing-init-end');
  measurePerformance('marketing-init-duration', 'marketing-init-start', 'marketing-init-end');
  
  // Return cleanup function
  return () => {
    monitor.disconnect();
    lazyLoader.disconnect();
  };
}

// Performance configuration for different page types
export const MARKETING_PERFORMANCE_CONFIG = {
  homepage: {
    lcpTarget: 2000,
    fidTarget: 80,
    clsTarget: 0.05,
    criticalImages: ['hero-banner', 'company-logo'],
    preloadFonts: ['Inter-Regular', 'Inter-Bold']
  },
  features: {
    lcpTarget: 2200,
    fidTarget: 100,
    clsTarget: 0.1,
    criticalImages: ['feature-hero'],
    preloadFonts: ['Inter-Regular']
  },
  pricing: {
    lcpTarget: 1800,
    fidTarget: 100,
    clsTarget: 0.05,
    criticalImages: [],
    preloadFonts: ['Inter-Regular', 'Inter-Medium']
  },
  solutions: {
    lcpTarget: 2500,
    fidTarget: 120,
    clsTarget: 0.1,
    criticalImages: ['solution-hero'],
    preloadFonts: ['Inter-Regular']
  }
} as const;

// Global performance state management
class PerformanceState {
  private metrics: WebVitalMetric[] = [];
  private budget = PERFORMANCE_BUDGETS;
  private violations: string[] = [];

  public addMetric(metric: WebVitalMetric) {
    this.metrics.push(metric);
    this.checkBudgetViolations();
  }

  public getMetrics() {
    return [...this.metrics];
  }

  public getBudgetViolations() {
    return [...this.violations];
  }

  private checkBudgetViolations() {
    const budgetPassed = checkPerformanceBudget(this.metrics);
    if (!budgetPassed) {
      // Track violations for reporting
      console.warn('Performance budget violations detected');
    }
  }

  public reset() {
    this.metrics = [];
    this.violations = [];
  }
}

// Global performance state
export const performanceState = new PerformanceState();

// Performance debugging utilities
export const debugPerformance = {
  /**
   * Log current performance metrics
   */
  logMetrics: () => {
    const metrics = performanceState.getMetrics();
    console.group('🚀 Performance Metrics');
    metrics.forEach(metric => {
      const emoji = metric.rating === 'good' ? '✅' : 
                    metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
    });
    console.groupEnd();
  },

  /**
   * Check if performance budgets are met
   */
  checkBudgets: () => {
    const violations = performanceState.getBudgetViolations();
    if (violations.length === 0) {
      console.log('✅ All performance budgets met');
    } else {
      console.warn('❌ Performance budget violations:', violations);
    }
  },

  /**
   * Get performance score (0-100)
   */
  getScore: () => {
    const metrics = performanceState.getMetrics();
    if (metrics.length === 0) return 0;

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 60;
        case 'poor': return 20;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }
};

// Export types for external use
export type {
  WebVitalMetric,
  PerformanceReport,
  PerformanceBudget,
  ImageOptimizationConfig,
  ResponsiveImageSet,
  OptimizedImageProps,
  BundleMetrics,
  BundleAnalysisResult,
  TreeShakeReport
};