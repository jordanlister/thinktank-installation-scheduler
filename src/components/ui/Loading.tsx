/**
 * Loading Components
 * Loading states, spinners, skeletons, and animation wrappers
 * Based on Think Tank Technologies Landing Page Design System
 */

import React, { forwardRef } from 'react';
import { cn, prefersReducedMotion } from '../../lib/utils';
import type { LoadingProps, BaseComponentProps, AnimationVariant } from '../../lib/types';

/**
 * Loading Spinner component
 * 
 * @example
 * ```tsx
 * // Basic spinner
 * <Loading />
 * 
 * // With custom size and color
 * <Loading size="lg" color="primary" />
 * 
 * // With text
 * <Loading text="Loading..." />
 * 
 * // Overlay mode
 * <Loading overlay text="Processing..." />
 * ```
 */
const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  (
    {
      className,
      variant = 'spinner',
      size = 'md',
      color = 'primary',
      text,
      overlay = false,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    if (variant === 'spinner') {
      return (
        <Spinner
          ref={ref}
          className={className}
          size={size}
          color={color}
          text={text}
          overlay={overlay}
          data-testid={testId}
          {...props}
        />
      );
    }

    if (variant === 'skeleton') {
      return (
        <Skeleton
          ref={ref}
          className={className}
          data-testid={testId}
          {...props}
        />
      );
    }

    if (variant === 'pulse') {
      return (
        <Pulse
          ref={ref}
          className={className}
          size={size}
          color={color}
          data-testid={testId}
          {...props}
        />
      );
    }

    return null;
  }
);

Loading.displayName = 'Loading';

/**
 * Spinner component
 */
export interface SpinnerProps extends Omit<LoadingProps, 'variant'> {}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      className,
      size = 'md',
      color = 'primary',
      text,
      overlay = false,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'w-4 h-4',
      sm: 'w-5 h-5',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    };

    const colorClasses = {
      primary: 'border-brand-primary',
      secondary: 'border-text-secondary',
      success: 'border-success',
      warning: 'border-warning',
      error: 'border-error',
      info: 'border-info',
    };

    const SpinnerSVG = () => (
      <svg
        className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    const content = (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center',
          text && 'flex-col space-y-2',
          className
        )}
        data-testid={testId}
        {...props}
      >
        <SpinnerSVG />
        {text && (
          <div className="text-sm text-text-secondary" aria-live="polite">
            {text}
          </div>
        )}
      </div>
    );

    if (overlay) {
      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          aria-label="Loading"
          role="status"
        >
          {content}
        </div>
      );
    }

    return content;
  }
);

Spinner.displayName = 'Spinner';

/**
 * Skeleton component for loading placeholders
 */
export interface SkeletonProps extends BaseComponentProps {
  /** Skeleton variant */
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Number of lines for text variant */
  lines?: number;
  /** Animation */
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'text',
      width,
      height,
      lines = 1,
      animation = 'wave',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const animationClasses = {
      pulse: 'animate-pulse',
      wave: 'ttt-skeleton',
      none: '',
    };

    const variantClasses = {
      text: 'h-4 rounded',
      rectangular: 'rounded',
      circular: 'rounded-full',
      rounded: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className={cn('space-y-2', className)}
          data-testid={testId}
          {...props}
        >
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                'bg-surface-glass',
                animationClasses[animation],
                variantClasses[variant],
                i === lines - 1 && 'w-3/4' // Make last line shorter
              )}
              style={i === lines - 1 ? { width: '75%' } : style}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-glass',
          animationClasses[animation],
          variantClasses[variant],
          className
        )}
        style={style}
        data-testid={testId}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Pulse component for attention-grabbing animations
 */
export interface PulseProps extends Omit<LoadingProps, 'variant' | 'text' | 'overlay'> {
  /** Duration of pulse animation */
  duration?: string;
}

const Pulse = forwardRef<HTMLDivElement, PulseProps>(
  (
    {
      className,
      size = 'md',
      color = 'primary',
      duration = '2s',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'w-2 h-2',
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    };

    const colorClasses = {
      primary: 'bg-brand-primary',
      secondary: 'bg-text-secondary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
      info: 'bg-info',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-full animate-ping',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        style={{
          animationDuration: duration,
        }}
        data-testid={testId}
        {...props}
      />
    );
  }
);

Pulse.displayName = 'Pulse';

/**
 * Progress Bar component
 */
export interface ProgressProps extends BaseComponentProps {
  /** Progress value (0-100) */
  value: number;
  /** Progress bar size */
  size?: 'sm' | 'md' | 'lg';
  /** Progress bar color */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Show value text */
  showValue?: boolean;
  /** Custom label */
  label?: string;
  /** Indeterminate progress */
  indeterminate?: boolean;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      size = 'md',
      color = 'primary',
      showValue = false,
      label,
      indeterminate = false,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    const colorClasses = {
      primary: 'bg-brand-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
    };

    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div ref={ref} className={cn('w-full', className)} data-testid={testId} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2">
            {label && (
              <span className="text-sm font-medium text-text-primary">{label}</span>
            )}
            {showValue && (
              <span className="text-sm text-text-muted">{Math.round(clampedValue)}%</span>
            )}
          </div>
        )}
        
        <div
          className={cn(
            'w-full bg-surface-elevated rounded-full overflow-hidden',
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              'transition-all duration-300 ease-out rounded-full',
              colorClasses[color],
              indeterminate && 'animate-pulse'
            )}
            style={{
              width: indeterminate ? '100%' : `${clampedValue}%`,
              animation: indeterminate ? 'progress-indeterminate 2s ease-in-out infinite' : undefined,
            }}
            role="progressbar"
            aria-valuenow={indeterminate ? undefined : clampedValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

/**
 * Animation Wrapper component for entrance animations
 */
export interface AnimationWrapperProps extends BaseComponentProps {
  children: React.ReactNode;
  /** Animation variant */
  animation?: AnimationVariant;
  /** Animation delay */
  delay?: number;
  /** Animation duration */
  duration?: number;
  /** Trigger animation when in viewport */
  inView?: boolean;
  /** Only animate once */
  once?: boolean;
}

const AnimationWrapper = forwardRef<HTMLDivElement, AnimationWrapperProps>(
  (
    {
      className,
      children,
      animation = 'fade-in',
      delay = 0,
      duration,
      inView = false,
      once = true,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(!inView);
    const [hasAnimated, setHasAnimated] = React.useState(false);
    const elementRef = React.useRef<HTMLDivElement>(null);

    // Intersection Observer for in-view animations
    React.useEffect(() => {
      if (!inView || hasAnimated) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              setHasAnimated(true);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        },
        { threshold: 0.1 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      };
    }, [inView, once, hasAnimated]);

    // Respect reduced motion preference
    const shouldAnimate = !prefersReducedMotion() && isVisible;

    const animationClasses = {
      'fade-in': shouldAnimate ? 'ttt-fade-in' : 'opacity-0',
      'slide-up': shouldAnimate ? 'ttt-slide-up' : 'opacity-0 translate-y-4',
      'scale-in': shouldAnimate ? 'ttt-scale-in' : 'opacity-0 scale-95',
      none: '',
    };

    const style: React.CSSProperties = {
      animationDelay: delay ? `${delay}ms` : undefined,
      animationDuration: duration ? `${duration}ms` : undefined,
    };

    return (
      <div
        ref={(node) => {
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
          elementRef.current = node;
        }}
        className={cn(animationClasses[animation], className)}
        style={style}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AnimationWrapper.displayName = 'AnimationWrapper';

/**
 * Fade Transition component for conditional content
 */
export interface FadeTransitionProps extends BaseComponentProps {
  /** Show content */
  show: boolean;
  /** Children to render */
  children: React.ReactNode;
  /** Transition duration */
  duration?: number;
  /** Unmount when hidden */
  unmountOnExit?: boolean;
}

const FadeTransition = forwardRef<HTMLDivElement, FadeTransitionProps>(
  (
    {
      className,
      show,
      children,
      duration = 300,
      unmountOnExit = false,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(show);
    const [shouldRender, setShouldRender] = React.useState(show || !unmountOnExit);

    React.useEffect(() => {
      if (show) {
        setShouldRender(true);
        setTimeout(() => setIsVisible(true), 10);
      } else {
        setIsVisible(false);
        if (unmountOnExit) {
          setTimeout(() => setShouldRender(false), duration);
        }
      }
    }, [show, unmountOnExit, duration]);

    if (!shouldRender) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'transition-opacity ease-in-out',
          isVisible ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          transitionDuration: `${duration}ms`,
        }}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FadeTransition.displayName = 'FadeTransition';

/**
 * Loading Overlay component for covering content during loading
 */
export interface LoadingOverlayProps extends BaseComponentProps {
  /** Show overlay */
  visible: boolean;
  /** Loading text */
  text?: string;
  /** Blur background */
  blur?: boolean;
  /** Overlay opacity */
  opacity?: number;
}

const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (
    {
      className,
      visible,
      text = 'Loading...',
      blur = true,
      opacity = 0.8,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    if (!visible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute inset-0 z-10 flex items-center justify-center',
          blur && 'backdrop-blur-sm',
          className
        )}
        style={{
          backgroundColor: `rgba(10, 10, 10, ${opacity})`,
        }}
        data-testid={testId}
        {...props}
      >
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" color="primary" />
          {text && (
            <div className="text-text-primary font-medium" aria-live="polite">
              {text}
            </div>
          )}
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

export { Loading as default, Spinner, Skeleton, Pulse, Progress, AnimationWrapper, FadeTransition, LoadingOverlay };