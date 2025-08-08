/**
 * Think Tank Technologies - Motion & Animation Utilities
 * Sophisticated animation system built on Framer Motion for marketing pages
 * Includes accessibility support and performance optimizations
 */

import { prefersReducedMotion } from './utils';

// ============================================================================
// ANIMATION TYPES & INTERFACES
// ============================================================================

export interface AnimationConfig {
  duration: number;
  delay: number;
  ease: string | number[];
  staggerChildren?: number;
}

export interface MotionVariants {
  initial: any;
  animate: any;
  exit?: any;
  whileHover?: any;
  whileTap?: any;
  whileInView?: any;
  viewport?: {
    once?: boolean;
    margin?: string;
    amount?: number | 'some' | 'all';
  };
}

export type AnimationDirection = 'up' | 'down' | 'left' | 'right';
export type AnimationIntensity = 'subtle' | 'normal' | 'dramatic';

// ============================================================================
// DESIGN TOKENS - ANIMATION SETTINGS
// ============================================================================

export const ANIMATION_TOKENS = {
  // Duration tokens (from design system)
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
    slowest: 1000,
  },
  
  // Easing curves (from design system)
  easing: {
    linear: [0, 0, 1, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    backOut: [0.34, 1.56, 0.64, 1],
    anticipate: [0.25, 0.46, 0.45, 0.94],
  },
  
  // Stagger timings for child animations
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
  },
  
  // Viewport margins for scroll-triggered animations
  viewport: {
    immediate: '0px',
    early: '-10%',
    late: '-20%',
    onScreen: '0px 0px -10% 0px',
  },
  
  // Transform values
  transform: {
    subtle: { x: 20, y: 20, scale: 0.05, rotate: 2 },
    normal: { x: 40, y: 40, scale: 0.1, rotate: 5 },
    dramatic: { x: 80, y: 80, scale: 0.2, rotate: 10 },
  },
} as const;

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Get animation duration based on user preferences
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Create animation config with accessibility support
 */
export function createAnimationConfig(
  duration: keyof typeof ANIMATION_TOKENS.duration,
  easing: keyof typeof ANIMATION_TOKENS.easing = 'easeOut',
  delay = 0
): AnimationConfig {
  return {
    duration: getAnimationDuration(ANIMATION_TOKENS.duration[duration]) / 1000,
    delay: getAnimationDuration(delay) / 1000,
    ease: prefersReducedMotion() ? ANIMATION_TOKENS.easing.linear : ANIMATION_TOKENS.easing[easing],
  };
}

/**
 * Apply reduced motion fallbacks to variants
 */
export function withReducedMotion(variants: MotionVariants): MotionVariants {
  if (prefersReducedMotion()) {
    return {
      initial: {},
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return variants;
}

// ============================================================================
// CORE ANIMATION VARIANTS
// ============================================================================

/**
 * Fade animations with direction support
 */
export function fadeVariants(
  direction: AnimationDirection = 'up',
  intensity: AnimationIntensity = 'normal',
  config?: Partial<AnimationConfig>
): MotionVariants {
  const transform = ANIMATION_TOKENS.transform[intensity];
  const animConfig = createAnimationConfig('normal', 'easeOut');
  
  const initialTransform = {
    up: { y: transform.y },
    down: { y: -transform.y },
    left: { x: transform.x },
    right: { x: -transform.x },
  }[direction];

  return withReducedMotion({
    initial: {
      opacity: 0,
      ...initialTransform,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { ...animConfig, ...config },
    },
    exit: {
      opacity: 0,
      ...initialTransform,
      transition: { duration: animConfig.duration * 0.5 },
    },
  });
}

/**
 * Scale animations for interactive elements
 */
export function scaleVariants(
  intensity: AnimationIntensity = 'normal',
  config?: Partial<AnimationConfig>
): MotionVariants {
  const transform = ANIMATION_TOKENS.transform[intensity];
  const animConfig = createAnimationConfig('normal', 'easeOut');

  return withReducedMotion({
    initial: {
      opacity: 0,
      scale: 1 - transform.scale,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { ...animConfig, ...config },
    },
    whileHover: {
      scale: 1 + transform.scale * 0.5,
      transition: createAnimationConfig('fast'),
    },
    whileTap: {
      scale: 1 - transform.scale * 0.3,
      transition: createAnimationConfig('fast'),
    },
    exit: {
      opacity: 0,
      scale: 1 - transform.scale,
      transition: { duration: animConfig.duration * 0.5 },
    },
  });
}

/**
 * Rotation animations for decorative elements
 */
export function rotateVariants(
  intensity: AnimationIntensity = 'normal',
  continuous = false
): MotionVariants {
  const transform = ANIMATION_TOKENS.transform[intensity];
  const animConfig = createAnimationConfig('slower', 'easeInOut');

  if (continuous) {
    return withReducedMotion({
      initial: { rotate: 0 },
      animate: {
        rotate: 360,
        transition: {
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        },
      },
    });
  }

  return withReducedMotion({
    initial: {
      opacity: 0,
      rotate: -transform.rotate,
    },
    animate: {
      opacity: 1,
      rotate: 0,
      transition: animConfig,
    },
    whileHover: {
      rotate: transform.rotate,
      transition: createAnimationConfig('normal'),
    },
  });
}

/**
 * Stagger container for child animations
 */
export function staggerContainerVariants(
  stagger: keyof typeof ANIMATION_TOKENS.stagger = 'normal',
  config?: Partial<AnimationConfig>
): MotionVariants {
  const animConfig = createAnimationConfig('normal');

  return withReducedMotion({
    initial: {},
    animate: {
      transition: {
        staggerChildren: ANIMATION_TOKENS.stagger[stagger],
        delayChildren: 0.1,
        ...config,
      },
    },
    exit: {
      transition: {
        staggerChildren: ANIMATION_TOKENS.stagger.fast,
        staggerDirection: -1,
      },
    },
  });
}

/**
 * Stagger child variants
 */
export function staggerChildVariants(
  direction: AnimationDirection = 'up',
  intensity: AnimationIntensity = 'normal'
): MotionVariants {
  return fadeVariants(direction, intensity);
}

// ============================================================================
// SPECIALIZED ANIMATION VARIANTS
// ============================================================================

/**
 * Hero background floating animation
 */
export function heroBackgroundFloat(): MotionVariants {
  return withReducedMotion({
    initial: { y: 0, rotate: 0 },
    animate: {
      y: [-10, 10, -10],
      rotate: [-1, 1, -1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });
}

/**
 * Card hover lift effect
 */
export function cardHoverVariants(): MotionVariants {
  return withReducedMotion({
    initial: {},
    whileHover: {
      y: -8,
      scale: 1.02,
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      transition: createAnimationConfig('normal', 'easeOut'),
    },
    whileTap: {
      scale: 0.98,
      transition: createAnimationConfig('fast'),
    },
  });
}

/**
 * Button press animation
 */
export function buttonVariants(): MotionVariants {
  return withReducedMotion({
    initial: {},
    whileHover: {
      scale: 1.05,
      transition: createAnimationConfig('fast', 'easeOut'),
    },
    whileTap: {
      scale: 0.95,
      transition: createAnimationConfig('fast'),
    },
  });
}

/**
 * Loading pulse animation
 */
export function pulseVariants(): MotionVariants {
  return withReducedMotion({
    initial: { opacity: 1 },
    animate: {
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });
}

/**
 * Skeleton loading shimmer
 */
export function shimmerVariants(): MotionVariants {
  return withReducedMotion({
    initial: { backgroundPosition: '-200% 0' },
    animate: {
      backgroundPosition: '200% 0',
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  });
}

// ============================================================================
// PAGE TRANSITION VARIANTS
// ============================================================================

/**
 * Page transition variants
 */
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: createAnimationConfig('normal', 'easeOut'),
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: createAnimationConfig('fast'),
  },
};

// ============================================================================
// SCROLL-TRIGGERED ANIMATION VARIANTS
// ============================================================================

/**
 * Scroll reveal animation with viewport detection
 */
export function scrollRevealVariants(
  direction: AnimationDirection = 'up',
  intensity: AnimationIntensity = 'normal',
  viewportMargin: keyof typeof ANIMATION_TOKENS.viewport = 'early'
): MotionVariants {
  const baseVariants = fadeVariants(direction, intensity);
  
  return {
    ...baseVariants,
    whileInView: baseVariants.animate,
    viewport: {
      once: true,
      margin: ANIMATION_TOKENS.viewport[viewportMargin],
      amount: 0.3,
    },
  };
}

/**
 * Parallax scroll effect
 */
export function parallaxVariants(intensity: number = 0.5): MotionVariants {
  return withReducedMotion({
    initial: {},
    animate: {},
    whileInView: {
      y: [-50 * intensity, 50 * intensity],
      transition: {
        duration: 0,
        ease: 'linear',
      },
    },
    viewport: {
      once: false,
    },
  });
}

// ============================================================================
// INTERACTIVE DEMO ANIMATIONS
// ============================================================================

/**
 * Data processing flow animation
 */
export function dataFlowVariants(delay: number = 0): MotionVariants {
  return withReducedMotion({
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, delay, ease: 'easeInOut' },
        opacity: { duration: 0.5, delay },
      },
    },
  });
}

/**
 * Scheduling optimization visualization
 */
export function schedulingAnimationVariants(): MotionVariants {
  return withReducedMotion({
    initial: { scale: 0, opacity: 0 },
    animate: (index: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  });
}

/**
 * Route optimization path animation
 */
export function routePathVariants(): MotionVariants {
  return withReducedMotion({
    initial: { pathLength: 0, pathOffset: 1 },
    animate: {
      pathLength: 1,
      pathOffset: 0,
      transition: {
        duration: 3,
        ease: 'easeInOut',
      },
    },
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create custom spring animation
 */
export function createSpringAnimation(
  stiffness: number = 100,
  damping: number = 10,
  mass: number = 1
) {
  return prefersReducedMotion()
    ? { duration: 0 }
    : { type: 'spring', stiffness, damping, mass };
}

/**
 * Create entrance animation with custom delay
 */
export function createEntranceAnimation(
  direction: AnimationDirection = 'up',
  delay: number = 0
): MotionVariants {
  const variants = fadeVariants(direction);
  return {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...variants.animate.transition,
        delay: getAnimationDuration(delay) / 1000,
      },
    },
  };
}

/**
 * Create hover glow effect
 */
export function createGlowEffect(color: string = 'var(--brand-primary)'): any {
  if (prefersReducedMotion()) return {};
  
  return {
    whileHover: {
      boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
      transition: createAnimationConfig('normal'),
    },
  };
}

/**
 * Performance optimization: will-change utility
 */
export function applyWillChange(properties: string[]): React.CSSProperties {
  if (prefersReducedMotion()) return {};
  
  return {
    willChange: properties.join(', '),
  };
}

/**
 * Remove will-change after animation
 */
export function removeWillChange(element: HTMLElement): void {
  if (element && element.style) {
    element.style.willChange = 'auto';
  }
}

// ============================================================================
// ANIMATION SEQUENCES
// ============================================================================

/**
 * Create complex animation sequence
 */
export interface AnimationStep {
  target: any;
  duration: number;
  delay?: number;
  ease?: keyof typeof ANIMATION_TOKENS.easing;
}

export function createSequence(steps: AnimationStep[]): any[] {
  if (prefersReducedMotion()) {
    return steps.map(step => ({ ...step.target, transition: { duration: 0 } }));
  }

  return steps.map(step => ({
    ...step.target,
    transition: {
      duration: step.duration / 1000,
      delay: (step.delay || 0) / 1000,
      ease: ANIMATION_TOKENS.easing[step.ease || 'easeOut'],
    },
  }));
}

/**
 * Hero entrance sequence
 */
export const heroEntranceSequence = createSequence([
  { target: { opacity: 1, y: 0 }, duration: 600, delay: 200 },
  { target: { opacity: 1, scale: 1 }, duration: 400, delay: 800 },
  { target: { opacity: 1, x: 0 }, duration: 500, delay: 1000 },
]);

export default {
  fadeVariants,
  scaleVariants,
  rotateVariants,
  staggerContainerVariants,
  staggerChildVariants,
  scrollRevealVariants,
  cardHoverVariants,
  buttonVariants,
  createAnimationConfig,
  withReducedMotion,
  ANIMATION_TOKENS,
};