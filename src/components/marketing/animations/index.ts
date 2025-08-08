/**
 * Marketing Animation Components - Main Export
 * Comprehensive animation system for Think Tank Technologies landing pages
 * Built with performance, accessibility, and design system integration
 */

// Hero Section Animations
export {
  AnimatedGrid,
  FloatingElements,
  AnimatedText,
  HeroGradient,
  ProductMockup,
  Particles,
  AnimatedCounter,
  HeroAnimations,
  default as HeroAnimationsComponents,
} from './HeroAnimations';

// Interactive Elements
export {
  AnimatedFeatureCard,
  AnimatedButton,
  AnimatedInput,
  AnimatedStatCard,
  AnimatedTestimonialCard,
  ScrollReveal,
} from './InteractiveElements';

// Demo Visualizations
export {
  SchedulingDemo,
  RouteOptimizationDemo,
  DataProcessingDemo,
  TeamWorkloadDemo,
} from './DemoAnimations';

// Loading & State Animations
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
} from './LoadingAnimations';

// Animation utilities (re-export from lib)
export {
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
} from '@/lib/animations';

// Component collections for easy import
export const HeroComponents = {
  AnimatedGrid,
  FloatingElements,
  AnimatedText,
  HeroGradient,
  ProductMockup,
  Particles,
  AnimatedCounter,
  HeroAnimations,
};

export const InteractiveComponents = {
  AnimatedFeatureCard,
  AnimatedButton,
  AnimatedInput,
  AnimatedStatCard,
  AnimatedTestimonialCard,
  ScrollReveal,
};

export const DemoComponents = {
  SchedulingDemo,
  RouteOptimizationDemo,
  DataProcessingDemo,
  TeamWorkloadDemo,
};

export const LoadingComponents = {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  LoadingSpinner,
  ProgressBar,
  CircularProgress,
  StateIcon,
  LoadingOverlay,
  TypingAnimation,
};