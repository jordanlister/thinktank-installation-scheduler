/**
 * Performance Optimization Utilities
 * Tools for monitoring and optimizing animation performance
 * Built for accessibility and smooth 60fps performance
 */

import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../../lib/utils';

// ============================================================================
// PERFORMANCE MONITORING HOOKS
// ============================================================================

/**
 * Hook to monitor frame rates during animations
 */
export const useFrameRate = () => {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fps = useRef(60);

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        fps.current = Math.round((frameCount.current * 1000) / delta);
        frameCount.current = 0;
        lastTime.current = now;

        // Log performance warnings in development
        if (process.env.NODE_ENV === 'development' && fps.current < 30) {
          console.warn('Animation performance warning: FPS dropped to', fps.current);
        }
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    if (!prefersReducedMotion()) {
      measureFPS();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return fps.current;
};

/**
 * Hook to optimize will-change property
 */
export const useWillChange = (isAnimating: boolean, properties: string[] = ['transform', 'opacity']) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || prefersReducedMotion()) return;

    if (isAnimating) {
      element.style.willChange = properties.join(', ');
    } else {
      element.style.willChange = 'auto';
    }

    // Cleanup on unmount
    return () => {
      if (element) {
        element.style.willChange = 'auto';
      }
    };
  }, [isAnimating, properties]);

  return elementRef;
};

/**
 * Hook for intersection observer with animation optimization
 */
export const useIntersectionAnimation = (
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          callback(entry.isIntersecting);
          
          // Optimize performance by removing will-change when not visible
          if (entry.isIntersecting) {
            entry.target.classList.add('optimize-animation');
          } else {
            entry.target.classList.add('animation-complete');
            entry.target.classList.remove('optimize-animation');
          }
        });
      },
      {
        rootMargin: '-10%',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return elementRef;
};

// ============================================================================
// PERFORMANCE OPTIMIZATION COMPONENTS
// ============================================================================

/**
 * Component that monitors and optimizes animation performance
 */
export const PerformanceOptimizer: React.FC<{
  children: React.ReactNode;
  threshold?: number;
}> = ({ children, threshold = 30 }) => {
  const fps = useFrameRate();
  const [isOptimized, setIsOptimized] = React.useState(false);

  useEffect(() => {
    if (fps < threshold && !prefersReducedMotion()) {
      setIsOptimized(true);
      console.warn('Enabling performance optimization mode due to low FPS:', fps);
    } else if (fps >= threshold + 10) {
      setIsOptimized(false);
    }
  }, [fps, threshold]);

  return (
    <div className={isOptimized ? 'performance-optimized' : ''}>
      {children}
    </div>
  );
};

/**
 * GPU acceleration helper component
 */
export const GPUAccelerated: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={`gpu-accelerated ${className || ''}`}>
      {children}
    </div>
  );
};

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Component that respects user motion preferences
 */
export const MotionSafe: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const [prefersReduced, setPrefersReduced] = React.useState(prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      setPrefersReduced(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (prefersReduced) {
    return <>{fallback || children}</>;
  }

  return <>{children}</>;
};

/**
 * Hook for testing animation accessibility
 */
export const useAnimationA11y = () => {
  const checkAnimationA11y = React.useCallback((element: HTMLElement) => {
    const results = {
      respectsReducedMotion: true,
      hasFocusIndicators: false,
      hasProperContrast: true,
      isKeyboardAccessible: false,
    };

    // Check if element respects reduced motion
    const computedStyle = window.getComputedStyle(element);
    const hasAnimations = computedStyle.animationName !== 'none' || 
                         computedStyle.transitionProperty !== 'none';

    if (hasAnimations && prefersReducedMotion()) {
      const duration = parseFloat(computedStyle.animationDuration || '0');
      const transitionDuration = parseFloat(computedStyle.transitionDuration || '0');
      
      results.respectsReducedMotion = duration <= 0.01 && transitionDuration <= 0.01;
    }

    // Check for focus indicators
    const focusStyles = window.getComputedStyle(element, ':focus');
    results.hasFocusIndicators = focusStyles.outline !== 'none' || 
                                focusStyles.boxShadow !== 'none';

    // Check keyboard accessibility
    results.isKeyboardAccessible = element.tabIndex >= 0 || 
                                  element.hasAttribute('tabindex') ||
                                  ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);

    return results;
  }, []);

  return { checkAnimationA11y };
};

/**
 * Component for testing animation accessibility in development
 */
export const AnimationA11yTester: React.FC<{
  children: React.ReactNode;
  enabled?: boolean;
}> = ({ children, enabled = process.env.NODE_ENV === 'development' }) => {
  const { checkAnimationA11y } = useAnimationA11y();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const observer = new MutationObserver(() => {
      const animatedElements = containerRef.current?.querySelectorAll(
        '[style*="animation"], [style*="transition"], .animate-'
      );

      animatedElements?.forEach((element) => {
        const results = checkAnimationA11y(element as HTMLElement);
        
        if (!results.respectsReducedMotion) {
          console.warn('Accessibility warning: Animation does not respect prefers-reduced-motion', element);
        }
        
        if (!results.hasFocusIndicators && results.isKeyboardAccessible) {
          console.warn('Accessibility warning: Focusable animated element lacks focus indicators', element);
        }
      });
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => observer.disconnect();
  }, [enabled, checkAnimationA11y]);

  return <div ref={containerRef}>{children}</div>;
};

// ============================================================================
// PERFORMANCE DEBUGGING UTILITIES
// ============================================================================

/**
 * Performance debugger for development
 */
export const AnimationDebugger: React.FC<{
  enabled?: boolean;
}> = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const fps = useFrameRate();
  const [stats, setStats] = React.useState({
    averageFPS: 60,
    droppedFrames: 0,
    animationCount: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    const updateStats = () => {
      const animatedElements = document.querySelectorAll('.animate-*, [style*="animation"], [style*="transition"]');
      setStats(prev => ({
        averageFPS: Math.round((prev.averageFPS + fps) / 2),
        droppedFrames: fps < 30 ? prev.droppedFrames + 1 : prev.droppedFrames,
        animationCount: animatedElements.length,
      }));
    };

    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [enabled, fps]);

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs z-50 font-mono">
      <div>FPS: {fps}</div>
      <div>Avg: {stats.averageFPS}</div>
      <div>Dropped: {stats.droppedFrames}</div>
      <div>Animations: {stats.animationCount}</div>
    </div>
  );
};

/**
 * Utility to measure animation performance
 */
export const measureAnimationPerformance = (name: string, callback: () => void) => {
  if (typeof performance !== 'undefined' && process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    console.log(`Animation "${name}" took ${endTime - startTime} milliseconds`);
  } else {
    callback();
  }
};

export default {
  useFrameRate,
  useWillChange,
  useIntersectionAnimation,
  PerformanceOptimizer,
  GPUAccelerated,
  MotionSafe,
  useAnimationA11y,
  AnimationA11yTester,
  AnimationDebugger,
  measureAnimationPerformance,
};