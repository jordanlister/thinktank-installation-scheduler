/**
 * Bundle Optimization Utilities
 * 
 * Provides helpers for:
 * - Bundle size analysis and monitoring
 * - Code splitting strategies
 * - Tree shaking optimization
 * - Dynamic imports for non-critical code
 * - Bundle performance tracking
 */

export interface BundleMetrics {
  size: number;
  gzipSize: number;
  modules: number;
  chunks: number;
  assets: string[];
  timestamp: number;
}

export interface CodeSplitConfig {
  chunks: 'all' | 'async' | 'initial';
  minSize: number;
  maxSize: number;
  cacheGroups: Record<string, any>;
}

export interface ImportAnalysis {
  module: string;
  size: number;
  used: boolean;
  treeshaken: boolean;
}

/**
 * Bundle size monitoring and alerting
 */
export class BundleMonitor {
  private readonly maxBundleSize = 250000; // 250KB
  private readonly maxChunkSize = 50000;   // 50KB
  
  public analyzeBundle(metrics: BundleMetrics): BundleAnalysisResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check total bundle size
    if (metrics.size > this.maxBundleSize) {
      issues.push(`Bundle size (${this.formatBytes(metrics.size)}) exceeds limit (${this.formatBytes(this.maxBundleSize)})`);
      recommendations.push('Consider code splitting or removing unused dependencies');
    }
    
    // Check gzip efficiency
    const compressionRatio = metrics.gzipSize / metrics.size;
    if (compressionRatio > 0.8) {
      issues.push(`Poor compression ratio: ${(compressionRatio * 100).toFixed(1)}%`);
      recommendations.push('Consider using more compressible code patterns or modern bundling');
    }
    
    // Check chunk count
    if (metrics.chunks > 20) {
      issues.push(`High chunk count: ${metrics.chunks}`);
      recommendations.push('Consider reducing code splitting or merging related chunks');
    }
    
    return {
      metrics,
      issues,
      recommendations,
      score: this.calculateBundleScore(metrics, issues)
    };
  }
  
  private calculateBundleScore(metrics: BundleMetrics, issues: string[]): number {
    let score = 100;
    
    // Penalize oversized bundles
    if (metrics.size > this.maxBundleSize) {
      const overage = (metrics.size - this.maxBundleSize) / this.maxBundleSize;
      score -= Math.min(overage * 50, 40);
    }
    
    // Penalize poor compression
    const compressionRatio = metrics.gzipSize / metrics.size;
    if (compressionRatio > 0.7) {
      score -= (compressionRatio - 0.7) * 100;
    }
    
    // Penalize each issue
    score -= issues.length * 5;
    
    return Math.max(0, Math.round(score));
  }
  
  private formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)}KB` : `${(kb / 1024).toFixed(1)}MB`;
  }
}

export interface BundleAnalysisResult {
  metrics: BundleMetrics;
  issues: string[];
  recommendations: string[];
  score: number;
}

/**
 * Code splitting utilities
 */
export class CodeSplitHelper {
  /**
   * Create a lazy-loaded component with error boundary
   */
  public static createLazyComponent<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>,
    fallback: React.ComponentType = LoadingFallback
  ) {
    const LazyComponent = React.lazy(factory);
    
    return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
      <React.Suspense fallback={<fallback />}>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <LazyComponent {...props} ref={ref} />
        </ErrorBoundary>
      </React.Suspense>
    ));
  }
  
  /**
   * Preload component for better UX
   */
  public static preloadComponent<T>(factory: () => Promise<{ default: T }>) {
    // Start loading the component
    factory().catch(error => {
      console.warn('Failed to preload component:', error);
    });
  }
  
  /**
   * Conditional import based on feature flags or user preferences
   */
  public static async conditionalImport<T>(
    condition: boolean | (() => boolean),
    factory: () => Promise<T>
  ): Promise<T | null> {
    const shouldImport = typeof condition === 'function' ? condition() : condition;
    
    if (!shouldImport) {
      return null;
    }
    
    try {
      return await factory();
    } catch (error) {
      console.error('Conditional import failed:', error);
      return null;
    }
  }
}

// Default loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
  </div>
);

// Error fallback component
const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-500 mb-2">⚠️</div>
    <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
    <p className="text-sm text-gray-600 mb-4">
      {error?.message || 'Failed to load this component'}
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors"
    >
      Reload Page
    </button>
  </div>
);

/**
 * Tree shaking analysis utilities
 */
export class TreeShakeAnalyzer {
  private unusedExports = new Set<string>();
  private importMap = new Map<string, string[]>();
  
  /**
   * Track module usage for tree shaking analysis
   */
  public trackModuleUsage(moduleName: string, exports: string[]) {
    this.importMap.set(moduleName, exports);
  }
  
  /**
   * Mark export as used
   */
  public markExportUsed(moduleName: string, exportName: string) {
    const key = `${moduleName}.${exportName}`;
    this.unusedExports.delete(key);
  }
  
  /**
   * Generate tree shaking report
   */
  public generateReport(): TreeShakeReport {
    const totalExports = Array.from(this.importMap.values()).flat().length;
    const unusedCount = this.unusedExports.size;
    const utilizationRate = ((totalExports - unusedCount) / totalExports) * 100;
    
    return {
      totalExports,
      unusedExports: unusedCount,
      utilizationRate,
      suggestions: this.generateSuggestions()
    };
  }
  
  private generateSuggestions(): string[] {
    const suggestions: string[] = [];
    
    if (this.unusedExports.size > 0) {
      suggestions.push(`Remove ${this.unusedExports.size} unused exports to reduce bundle size`);
    }
    
    // Check for commonly unused modules
    const commonUnused = ['lodash', 'moment', 'axios'];
    this.importMap.forEach((exports, module) => {
      if (commonUnused.some(unused => module.includes(unused))) {
        suggestions.push(`Consider replacing ${module} with lighter alternatives`);
      }
    });
    
    return suggestions;
  }
}

export interface TreeShakeReport {
  totalExports: number;
  unusedExports: number;
  utilizationRate: number;
  suggestions: string[];
}

/**
 * Dynamic import strategies
 */
export const DynamicImportStrategies = {
  /**
   * Lazy load on user interaction
   */
  onInteraction: <T>(factory: () => Promise<T>) => {
    let importPromise: Promise<T> | null = null;
    
    return {
      preload: () => {
        if (!importPromise) {
          importPromise = factory();
        }
        return importPromise;
      },
      load: () => {
        if (!importPromise) {
          importPromise = factory();
        }
        return importPromise;
      }
    };
  },

  /**
   * Lazy load when element enters viewport
   */
  onIntersection: <T>(factory: () => Promise<T>, options?: IntersectionObserverInit) => {
    let importPromise: Promise<T> | null = null;
    
    return {
      observe: (element: Element) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !importPromise) {
                importPromise = factory();
                observer.unobserve(element);
              }
            });
          },
          { threshold: 0.1, ...options }
        );
        
        observer.observe(element);
        return observer;
      },
      load: () => {
        if (!importPromise) {
          importPromise = factory();
        }
        return importPromise;
      }
    };
  },

  /**
   * Lazy load after main thread is idle
   */
  onIdle: <T>(factory: () => Promise<T>) => {
    let importPromise: Promise<T> | null = null;
    
    const load = () => {
      if (!importPromise) {
        importPromise = factory();
      }
      return importPromise;
    };
    
    // Start loading when main thread is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(load, 100);
    }
    
    return { load };
  }
};

/**
 * Performance-aware module loading
 */
export class PerformantModuleLoader {
  private loadingModules = new Map<string, Promise<any>>();
  private cache = new Map<string, any>();
  
  /**
   * Load module with caching and deduplication
   */
  public async loadModule<T>(
    id: string,
    factory: () => Promise<T>,
    options: {
      cache?: boolean;
      timeout?: number;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<T> {
    const { cache = true, timeout = 10000, priority = 'normal' } = options;
    
    // Return cached module if available
    if (cache && this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    // Return existing loading promise to avoid duplicate requests
    if (this.loadingModules.has(id)) {
      return this.loadingModules.get(id);
    }
    
    // Create loading promise with timeout
    const loadingPromise = this.createTimeoutPromise(factory(), timeout)
      .then(module => {
        if (cache) {
          this.cache.set(id, module);
        }
        this.loadingModules.delete(id);
        return module;
      })
      .catch(error => {
        this.loadingModules.delete(id);
        console.error(`Failed to load module ${id}:`, error);
        throw error;
      });
    
    this.loadingModules.set(id, loadingPromise);
    
    // Adjust loading priority
    if (priority === 'high') {
      // Use higher priority loading (implementation depends on bundler)
      console.log(`High priority loading: ${id}`);
    }
    
    return loadingPromise;
  }
  
  private createTimeoutPromise<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Module load timeout: ${timeout}ms`)), timeout)
      )
    ]);
  }
  
  /**
   * Clear cache
   */
  public clearCache() {
    this.cache.clear();
    this.loadingModules.clear();
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      cachedModules: this.cache.size,
      loadingModules: this.loadingModules.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }
}

// React imports (would be available in actual React project)
declare const React: any;

// Bundle optimization recommendations
export const BUNDLE_OPTIMIZATION_TIPS = [
  'Use dynamic imports for routes and heavy components',
  'Implement tree shaking for unused code elimination',
  'Split vendor dependencies into separate chunks',
  'Use compression (gzip/brotli) for production builds',
  'Analyze bundle with webpack-bundle-analyzer',
  'Consider using preload/prefetch for critical resources',
  'Remove unused CSS with PurgeCSS',
  'Optimize images and use modern formats (WebP, AVIF)',
  'Implement service worker for aggressive caching',
  'Use code splitting at route level for better loading'
] as const;