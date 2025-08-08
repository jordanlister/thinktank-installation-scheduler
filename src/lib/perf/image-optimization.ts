/**
 * Image Optimization Utilities
 * 
 * Provides helpers for:
 * - WebP/AVIF format conversion
 * - Responsive image sizing with srcset
 * - Lazy loading implementation  
 * - Critical image preloading
 * - Image compression optimization
 */

export interface ImageOptimizationConfig {
  formats: ('webp' | 'avif' | 'jpg' | 'png')[];
  sizes: number[];
  quality: number;
  lazyLoading: boolean;
  preload: boolean;
  placeholder: 'blur' | 'empty';
}

export interface ResponsiveImageSet {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  alt: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

// Default optimization settings
export const DEFAULT_IMAGE_CONFIG: ImageOptimizationConfig = {
  formats: ['webp', 'jpg'],
  sizes: [320, 640, 768, 1024, 1280, 1536, 1920],
  quality: 80,
  lazyLoading: true,
  preload: false,
  placeholder: 'blur'
};

// Critical images that should be preloaded
export const CRITICAL_IMAGES = [
  'hero-image',
  'logo',
  'above-the-fold-banner'
];

/**
 * Generate responsive image set with multiple formats and sizes
 */
export function generateResponsiveImageSet(
  basePath: string,
  config: Partial<ImageOptimizationConfig> = {}
): ResponsiveImageSet {
  const finalConfig = { ...DEFAULT_IMAGE_CONFIG, ...config };
  
  // Extract filename without extension
  const filename = basePath.split('/').pop()?.split('.')[0] || 'image';
  const directory = basePath.substring(0, basePath.lastIndexOf('/') + 1);
  
  // Generate srcset for different formats and sizes
  const srcSets = finalConfig.formats.map(format => {
    const formatSrcSet = finalConfig.sizes
      .map(size => `${directory}${filename}-${size}w.${format} ${size}w`)
      .join(', ');
    return formatSrcSet;
  });
  
  // Create sizes attribute based on common breakpoints
  const sizes = [
    '(max-width: 320px) 320px',
    '(max-width: 640px) 640px', 
    '(max-width: 768px) 768px',
    '(max-width: 1024px) 1024px',
    '(max-width: 1280px) 1280px',
    '(max-width: 1536px) 1536px',
    '1920px'
  ].join(', ');
  
  // Use largest size as fallback src
  const largestSize = Math.max(...finalConfig.sizes);
  const primaryFormat = finalConfig.formats[0];
  const src = `${directory}${filename}-${largestSize}w.${primaryFormat}`;
  
  return {
    src,
    srcSet: srcSets[0], // Use first format as primary
    sizes,
    width: largestSize,
    height: Math.round(largestSize * 0.6), // Assume 16:9 aspect ratio
    alt: '', // To be filled by consuming component
    loading: finalConfig.lazyLoading ? 'lazy' : 'eager',
    decoding: 'async',
    fetchPriority: finalConfig.preload ? 'high' : 'auto'
  };
}

/**
 * Optimized Image Component Props
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
  formats?: ('webp' | 'avif' | 'jpg' | 'png')[];
  sizes?: string;
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurPlaceholder(width: number = 8, height: number = 6): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Lazy loading intersection observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private imageQueue = new Set<HTMLImageElement>();

  constructor() {
    this.initObserver();
  }

  private initObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images immediately
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
            this.imageQueue.delete(img);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before image enters viewport
        threshold: 0.1
      }
    );
  }

  public observe(img: HTMLImageElement) {
    if (!this.observer) {
      this.loadImage(img);
      return;
    }

    this.imageQueue.add(img);
    this.observer.observe(img);
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    const srcSet = img.dataset.srcset;

    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }

    if (srcSet) {
      img.srcset = srcSet;
      img.removeAttribute('data-srcset');
    }

    // Add loaded class for CSS transitions
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    }, { once: true });

    // Handle load errors
    img.addEventListener('error', () => {
      console.warn('Failed to load image:', src);
      img.classList.add('error');
    }, { once: true });
  }

  private loadAllImages() {
    this.imageQueue.forEach(img => this.loadImage(img));
    this.imageQueue.clear();
  }

  public disconnect() {
    this.observer?.disconnect();
    this.imageQueue.clear();
  }
}

// Global lazy loader instance
let globalLazyLoader: LazyImageLoader | null = null;

export function getLazyImageLoader(): LazyImageLoader {
  if (!globalLazyLoader) {
    globalLazyLoader = new LazyImageLoader();
  }
  return globalLazyLoader;
}

/**
 * Preload critical images
 */
export function preloadCriticalImages(images: string[]) {
  if (typeof window === 'undefined') return;

  images.forEach(imagePath => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = imagePath;
    link.as = 'image';
    
    // Use WebP if supported
    if (supportsWebP()) {
      const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/, '.webp');
      link.href = webpPath;
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Check WebP support
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Check AVIF support
 */
export function supportsAVIF(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(): 'avif' | 'webp' | 'jpg' {
  if (supportsAVIF()) return 'avif';
  if (supportsWebP()) return 'webp';
  return 'jpg';
}

/**
 * Image performance monitoring
 */
export function trackImagePerformance(imagePath: string, startTime: number) {
  const loadTime = performance.now() - startTime;
  
  // Track slow loading images (> 1s)
  if (loadTime > 1000) {
    console.warn(`Slow image load: ${imagePath} took ${loadTime.toFixed(2)}ms`);
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'slow_image', {
        event_category: 'Performance',
        event_label: imagePath,
        value: Math.round(loadTime)
      });
    }
  }
}

/**
 * Image compression quality recommendations based on image type
 */
export const IMAGE_QUALITY_PRESETS = {
  hero: 90,        // Hero images need high quality
  product: 85,     // Product images need good quality
  thumbnail: 75,   // Thumbnails can be lower quality
  icon: 90,        // Icons should be crisp
  background: 70   // Background images can be more compressed
} as const;

/**
 * Responsive breakpoints for image sizing
 */
export const IMAGE_BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1440,
  xlarge: 1920
} as const;

/**
 * Calculate optimal image dimensions for responsive display
 */
export function calculateResponsiveDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(maxWidth * aspectRatio)
  };
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}