/**
 * Page Transition Components
 * Smooth page transitions for marketing routes
 * Built with Framer Motion and React Router
 */

import React from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  pageTransition,
  withReducedMotion,
  createAnimationConfig,
  ANIMATION_TOKENS
} from '../../../lib/animations';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
}

interface FadeTransitionProps extends Omit<MotionProps, 'variants'> {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

interface SlideTransitionProps extends Omit<MotionProps, 'variants'> {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}

// ============================================================================
// TRANSITION VARIANTS
// ============================================================================

const fadeTransitionVariants = withReducedMotion({
  initial: { 
    opacity: 0,
    y: 20
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: createAnimationConfig('normal', 'easeOut')
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: createAnimationConfig('fast')
  }
});

const slideTransitionVariants = {
  left: withReducedMotion({
    initial: { opacity: 0, x: 300 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: createAnimationConfig('normal', 'easeOut')
    },
    exit: { 
      opacity: 0, 
      x: -300,
      transition: createAnimationConfig('fast')
    }
  }),
  right: withReducedMotion({
    initial: { opacity: 0, x: -300 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: createAnimationConfig('normal', 'easeOut')
    },
    exit: { 
      opacity: 0, 
      x: 300,
      transition: createAnimationConfig('fast')
    }
  }),
  up: withReducedMotion({
    initial: { opacity: 0, y: 300 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: createAnimationConfig('normal', 'easeOut')
    },
    exit: { 
      opacity: 0, 
      y: -300,
      transition: createAnimationConfig('fast')
    }
  }),
  down: withReducedMotion({
    initial: { opacity: 0, y: -300 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: createAnimationConfig('normal', 'easeOut')
    },
    exit: { 
      opacity: 0, 
      y: 300,
      transition: createAnimationConfig('fast')
    }
  })
};

const scaleTransitionVariants = withReducedMotion({
  initial: { 
    opacity: 0, 
    scale: 0.9,
    y: 20
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_TOKENS.duration.normal / 1000,
      ease: ANIMATION_TOKENS.easing.easeOut
    }
  },
  exit: { 
    opacity: 0, 
    scale: 1.05,
    y: -20,
    transition: {
      duration: ANIMATION_TOKENS.duration.fast / 1000,
      ease: ANIMATION_TOKENS.easing.easeIn
    }
  }
});

// ============================================================================
// CORE TRANSITION COMPONENTS
// ============================================================================

/**
 * Basic page transition wrapper
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className
}) => {
  return (
    <motion.div
      className={className}
      variants={fadeTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

/**
 * Route-aware transition wrapper that uses location as key
 */
export const RouteTransition: React.FC<RouteTransitionProps> = ({
  children,
  className
}) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className={className}
        variants={fadeTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// SPECIALIZED TRANSITION COMPONENTS
// ============================================================================

/**
 * Fade transition with customizable duration
 */
export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  duration = 300,
  className,
  ...props
}) => {
  const variants = withReducedMotion({
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: duration / 1000 }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: (duration * 0.5) / 1000 }
    }
  });

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Slide transition with directional support
 */
export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  direction = 'right',
  className,
  ...props
}) => {
  const variants = slideTransitionVariants[direction];

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Scale transition for modal-like experiences
 */
export const ScaleTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      className={className}
      variants={scaleTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// MARKETING-SPECIFIC TRANSITIONS
// ============================================================================

/**
 * Marketing page transition with staggered content reveal
 */
export const MarketingPageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const variants = withReducedMotion({
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  });

  const childVariants = withReducedMotion({
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  });

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div variants={childVariants}>
        {children}
      </motion.div>
    </motion.div>
  );
};

/**
 * Section transition for content within pages
 */
export const SectionTransition: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => {
  const variants = withReducedMotion({
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: delay / 1000,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  });

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-10%' }}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// LOADING TRANSITIONS
// ============================================================================

/**
 * Loading overlay transition
 */
export const LoadingTransition: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, children, className }) => {
  const variants = withReducedMotion({
    loading: { opacity: 0.5, scale: 0.98 },
    loaded: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  });

  return (
    <motion.div
      className={className}
      variants={variants}
      animate={isLoading ? 'loading' : 'loaded'}
    >
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// LAYOUT TRANSITIONS
// ============================================================================

/**
 * Layout transition for responsive changes
 */
export const LayoutTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      className={className}
      layout
      transition={{
        layout: {
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Shared layout transition for connecting elements across pages
 */
export const SharedLayoutTransition: React.FC<{
  children: React.ReactNode;
  layoutId: string;
  className?: string;
}> = ({ children, layoutId, className }) => {
  return (
    <motion.div
      className={className}
      layoutId={layoutId}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get current route transition direction
 */
export const useRouteTransition = () => {
  const location = useLocation();
  const [direction, setDirection] = React.useState<'forward' | 'backward'>('forward');

  React.useEffect(() => {
    // Simple logic to determine direction based on route depth
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const isDeeper = pathSegments.length > 1;
    setDirection(isDeeper ? 'forward' : 'backward');
  }, [location.pathname]);

  return { direction, pathname: location.pathname };
};

/**
 * Hook for page loading state
 */
export const usePageLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return { isLoading, setIsLoading };
};

export default {
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
};