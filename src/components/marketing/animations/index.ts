/**
 * Marketing Animation Components - Main Export
 * Comprehensive animation system for Lead Route landing pages
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
  AnimatedButton as InteractiveAnimatedButton,
  AnimatedInput,
  AnimatedStatCard,
  AnimatedTestimonialCard,
  ScrollReveal as InteractiveScrollReveal,
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

// Scroll Animations
export {
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Parallax,
  SmoothScrollLink,
  ScrollProgressIndicator,
  HeroReveal,
  FeatureGrid,
  AnimatedStats,
  CTAReveal,
  useSmoothScroll,
} from './ScrollAnimations';

// Page Transitions
export {
  PageTransition,
  RouteTransition,
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  MarketingPageTransition,
  SectionTransition,
  LoadingTransition,
  LayoutTransition,
  SharedLayoutTransition,
  useRouteTransition,
  usePageLoading,
} from './PageTransitions';

// Interactive Components
export {
  AnimatedButton,
  CTAButton,
  AnimatedCard,
  FeatureCard,
  InteractiveIcon,
  HoverReveal,
  LoadingButton,
  FloatingActionButton,
  AnimatedTooltip,
} from './InteractiveComponents';

// Motion Wrappers
export {
  MarketingPageWrapper,
  MarketingSection,
  HeroSection,
  ContentSection,
  FeatureSection,
  Container,
  ResponsiveGrid,
  AnimatedLayout,
  ConditionalFade,
} from './MotionWrapper';

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

// Component collections removed to avoid circular dependencies
// Import individual components directly instead