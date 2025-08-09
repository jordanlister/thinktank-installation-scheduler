/**
 * AnimatedCounter Component
 * Smooth, performant counter animation with Framer Motion and scroll triggers
 * Built with accessibility support and TypeScript safety for marketing pages
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  createAnimationConfig, 
  withReducedMotion, 
  ANIMATION_TOKENS,
  getAnimationDuration,
  applyWillChange,
  removeWillChange
} from '@/lib/animations';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AnimatedCounterProps {
  /** The target value to count to */
  value: number;
  /** Text to display after the number (e.g., '%', '% faster', '+') */
  suffix?: string;
  /** Text to display before the number (e.g., '$', '+') */
  prefix?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Number of decimal places to show */
  decimals?: number;
  /** Easing curve for the animation */
  ease?: keyof typeof ANIMATION_TOKENS.easing;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** CSS class name for styling */
  className?: string;
  /** Intersection observer options for triggering animation */
  viewportOptions?: {
    once?: boolean;
    margin?: string;
    amount?: number | 'some' | 'all';
  };
  /** Format function for custom number formatting */
  formatNumber?: (value: number) => string;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Default number formatter with locale support
 */
const defaultFormatter = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Easing function for smooth counter animation
 * Uses ease-out curve for natural deceleration
 */
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

// ============================================================================
// ANIMATED COUNTER COMPONENT
// ============================================================================

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2,
  decimals = 0,
  ease = 'easeOut',
  delay = 0,
  className,
  viewportOptions = {
    once: true,
    margin: '0px 0px -10% 0px',
    amount: 0.5,
  },
  formatNumber,
  onComplete,
  'data-testid': testId,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  // Check if element is in viewport for scroll-triggered animation
  const isInView = useInView(containerRef, viewportOptions);

  // Motion values for Framer Motion integration
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 60,
    damping: 15,
    mass: 1,
  });

  // Apply performance optimizations
  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      Object.assign(element.style, applyWillChange(['transform']));
      
      return () => {
        removeWillChange(element);
      };
    }
  }, []);

  // Trigger animation when in view
  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      startAnimation();
    }
  }, [isInView]);

  // Spring motion value listener
  useEffect(() => {
    const unsubscribe = spring.onChange((latest) => {
      setDisplayValue(latest);
    });

    return unsubscribe;
  }, [spring]);

  /**
   * Start the counter animation with proper easing
   */
  const startAnimation = () => {
    // Handle reduced motion preference
    if (getAnimationDuration(1000) === 0) {
      setDisplayValue(value);
      onComplete?.();
      return;
    }

    const startTime = Date.now();
    const actualDelay = getAnimationDuration(delay * 1000);
    const actualDuration = getAnimationDuration(duration * 1000);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      // Handle delay
      if (elapsed < actualDelay) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min((elapsed - actualDelay) / actualDuration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = easedProgress * value;

      // Update motion value for Framer Motion
      motionValue.set(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at the target value
        motionValue.set(value);
        onComplete?.();
      }
    };

    // Start the animation
    animationRef.current = requestAnimationFrame(animate);
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Format the display value
  const formatValue = (val: number): string => {
    if (formatNumber) {
      return formatNumber(val);
    }
    return defaultFormatter(val, decimals);
  };

  // Create animation variants for the container
  const containerVariants = withReducedMotion({
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: createAnimationConfig('normal', ease, delay)
    },
  });

  return (
    <motion.span
      ref={containerRef}
      variants={containerVariants}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      className={cn(
        'inline-block tabular-nums',
        'transition-colors duration-300',
        className
      )}
      data-testid={testId}
      aria-live="polite"
      aria-label={`${prefix}${formatValue(value)}${suffix}`}
    >
      {prefix}
      <span className="font-mono">
        {formatValue(displayValue)}
      </span>
      {suffix}
    </motion.span>
  );
};

// ============================================================================
// SPECIALIZED COUNTER VARIANTS
// ============================================================================

/**
 * Percentage counter with built-in formatting
 */
export const PercentageCounter: React.FC<Omit<AnimatedCounterProps, 'suffix' | 'formatNumber'> & {
  showDecimals?: boolean;
}> = ({ showDecimals = false, ...props }) => (
  <AnimatedCounter
    {...props}
    suffix="%"
    decimals={showDecimals ? 1 : 0}
  />
);

/**
 * Currency counter with locale-aware formatting
 */
export const CurrencyCounter: React.FC<Omit<AnimatedCounterProps, 'prefix' | 'formatNumber'> & {
  currency?: string;
  locale?: string;
}> = ({ currency = 'USD', locale = 'en-US', ...props }) => (
  <AnimatedCounter
    {...props}
    formatNumber={(value) => 
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
  />
);

/**
 * Large number counter with abbreviated formatting (K, M, B)
 */
export const LargeNumberCounter: React.FC<AnimatedCounterProps> = (props) => (
  <AnimatedCounter
    {...props}
    formatNumber={(value) => {
      if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}B`;
      }
      if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
      }
      if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
      }
      return value.toString();
    }}
  />
);

/**
 * Stat card with animated counter - commonly used in marketing sections
 */
export interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  duration?: number;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  suffix,
  prefix,
  className,
  valueClassName,
  labelClassName,
  duration = 2,
  delay = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { 
    once: true, 
    margin: '0px 0px -10% 0px',
    amount: 0.3 
  });

  const cardVariants = withReducedMotion({
    initial: { 
      opacity: 0, 
      y: 30,
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: createAnimationConfig('normal', 'easeOut', delay)
    },
  });

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      className={cn(
        'text-center p-5 bg-surface/40 rounded-xl border border-border/60',
        'hover:border-brand-primary/30 transition-colors duration-300',
        'focus-within:ring-2 focus-within:ring-brand-primary/20',
        className
      )}
    >
      <AnimatedCounter
        value={value}
        suffix={suffix}
        prefix={prefix}
        duration={duration}
        delay={delay + 0.2}
        className={cn(
          'text-3xl font-bold text-brand-primary mb-3',
          valueClassName
        )}
      />
      <div className={cn(
        'text-sm font-medium text-white leading-tight',
        labelClassName
      )}>
        {label}
      </div>
    </motion.div>
  );
};

// Export all components
export default AnimatedCounter;