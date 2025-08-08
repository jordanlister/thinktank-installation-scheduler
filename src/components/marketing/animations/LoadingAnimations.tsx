/**
 * Loading & State Animations
 * Sophisticated loading states, skeleton screens, and state transitions
 * Optimized for performance and accessibility
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// SKELETON LOADING COMPONENTS
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'wave',
}) => {
  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'skeleton shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'bg-surface-elevated',
        variants[variant],
        animations[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
};

// ============================================================================
// SKELETON LAYOUTS
// ============================================================================

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  showAvatar = false,
  lines = 3,
}) => {
  return (
    <div className={cn('p-6 bg-surface-glass backdrop-blur-sm rounded-xl border border-border', className)}>
      {showAvatar && (
        <div className="flex items-center gap-4 mb-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton width="60%" className="mb-2" />
            <Skeleton width="40%" />
          </div>
        </div>
      )}
      
      <Skeleton width="80%" className="mb-4 h-6" />
      
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          className="mb-2"
        />
      ))}
    </div>
  );
};

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className,
}) => {
  return (
    <div className={cn('bg-surface-glass backdrop-blur-sm rounded-xl border border-border overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface-elevated/50">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} width="80%" height={16} />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="p-4 grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                width={colIndex === 0 ? '90%' : '70%'}
                animation="pulse"
                style={{ animationDelay: `${(rowIndex * columns + colIndex) * 100}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// LOADING SPINNERS
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'currentColor',
  className,
  variant = 'spinner',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  if (variant === 'spinner') {
    return (
      <div
        className={cn(
          'border-2 border-current border-t-transparent rounded-full animate-spin',
          sizes[size],
          className
        )}
        style={{ color }}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex gap-1', className)} role="status" aria-label="Loading">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={cn('rounded-full animate-pulse', {
              'w-2 h-2': size === 'sm',
              'w-3 h-3': size === 'md',
              'w-4 h-4': size === 'lg',
              'w-6 h-6': size === 'xl',
            })}
            style={{
              backgroundColor: color,
              animationDelay: `${index * 200}ms`,
              animationDuration: '1s',
            }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex gap-1 items-end', className)} role="status" aria-label="Loading">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn('rounded-sm', {
              'w-1': size === 'sm',
              'w-1.5': size === 'md',
              'w-2': size === 'lg',
              'w-3': size === 'xl',
            })}
            style={{
              backgroundColor: color,
              height: size === 'sm' ? '12px' : size === 'md' ? '16px' : size === 'lg' ? '20px' : '24px',
              animation: `bars-loading 1.2s ease-in-out infinite`,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Pulse variant
  return (
    <div
      className={cn('rounded-full animate-pulse', sizes[size], className)}
      style={{ backgroundColor: color }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ============================================================================
// PROGRESS INDICATORS
// ============================================================================

interface ProgressBarProps {
  progress: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  size = 'md',
  color = 'var(--brand-primary)',
  backgroundColor = 'var(--surface)',
  animated = true,
  showLabel = false,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>Progress</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      
      <div
        className={cn('w-full rounded-full overflow-hidden', sizes[size])}
        style={{ backgroundColor }}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            animated && 'progress-fill'
          )}
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  showLabel?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  color = 'var(--brand-primary)',
  backgroundColor = 'var(--surface)',
  className,
  showLabel = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-text-primary">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUCCESS/ERROR STATE ANIMATIONS
// ============================================================================

interface StateIconProps {
  state: 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const StateIcon: React.FC<StateIconProps> = ({
  state,
  size = 'md',
  animated = true,
  className,
}) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colors = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  };

  const icons = {
    success: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        sizes[size],
        colors[state],
        animated && 'animate-scale-in',
        className
      )}
    >
      {icons[state]}
    </div>
  );
};

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  spinner?: React.ComponentProps<typeof LoadingSpinner>['variant'];
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  spinner = 'spinner',
  className,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm',
        'flex flex-col items-center justify-center',
        'z-50 rounded-lg',
        'animate-fade-in-up',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner variant={spinner} size="lg" className="mb-4" />
      <p className="text-text-secondary text-sm">{message}</p>
    </div>
  );
};

// ============================================================================
// TYPING ANIMATION
// ============================================================================

interface TypingAnimationProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 50,
  delay = 0,
  className,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let index = 0;
      
      const typeNextCharacter = () => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
          setTimeout(typeNextCharacter, speed);
        } else {
          setShowCursor(false);
          onComplete?.();
        }
      };

      typeNextCharacter();
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay, onComplete]);

  return (
    <span className={cn('font-mono', className)}>
      {displayedText}
      {showCursor && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

// ============================================================================
// CSS ANIMATION KEYFRAMES
// ============================================================================

const LoadingAnimationStyles = () => (
  <style jsx global>{`
    @keyframes bars-loading {
      0%, 40%, 100% {
        opacity: 0.3;
        transform: scaleY(0.4);
      }
      20% {
        opacity: 1;
        transform: scaleY(1);
      }
    }
  `}</style>
);

// Export all components
export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  LoadingSpinner,
  ProgressBar,
  CircularProgress,
  StateIcon,
  LoadingOverlay,
  TypingAnimation,
  LoadingAnimationStyles,
};