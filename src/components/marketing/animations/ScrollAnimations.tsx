/**
 * Scroll Animation Components
 * Smooth scroll-triggered animations for marketing pages
 * Built with Framer Motion and accessibility support
 */

import React from 'react';
import { motion, useScroll, useTransform, MotionProps } from 'framer-motion';
import { 
  scrollRevealVariants,
  staggerContainerVariants,
  staggerChildVariants,
  fadeVariants,
  scaleVariants,
  ANIMATION_TOKENS,
  withReducedMotion
} from '../../../lib/animations';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ScrollRevealProps extends Omit<MotionProps, 'variants'> {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  intensity?: 'subtle' | 'normal' | 'dramatic';
  delay?: number;
  className?: string;
  once?: boolean;
  margin?: string;
  amount?: number | 'some' | 'all';
}

interface StaggerGroupProps extends Omit<MotionProps, 'variants'> {
  children: React.ReactNode;
  stagger?: 'fast' | 'normal' | 'slow';
  className?: string;
  once?: boolean;
}

interface ParallaxProps extends Omit<MotionProps, 'style'> {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

interface SmoothScrollLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

// ============================================================================
// SCROLL REVEAL COMPONENTS
// ============================================================================

/**
 * Animated reveal on scroll with customizable direction and intensity
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  intensity = 'normal',
  delay = 0,
  className,
  once = true,
  margin = '-10%',
  amount = 0.3,
  ...props
}) => {
  const variants = withReducedMotion(
    scrollRevealVariants(direction, intensity, 'early')
  );

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once, margin, amount }}
      transition={{
        ...variants.animate?.transition,
        delay: delay / 1000,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Staggered animation container for multiple child elements
 */
export const StaggerGroup: React.FC<StaggerGroupProps> = ({
  children,
  stagger = 'normal',
  className,
  once = true,
  ...props
}) => {
  const containerVariants = withReducedMotion(staggerContainerVariants(stagger));

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once, margin: '-10%', amount: 0.1 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Individual stagger child component
 */
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}> = ({ children, direction = 'up', className }) => {
  const variants = withReducedMotion(staggerChildVariants(direction));

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
};

// ============================================================================
// PARALLAX COMPONENTS
// ============================================================================

/**
 * Parallax scrolling effect component
 */
export const Parallax: React.FC<ParallaxProps> = ({
  children,
  offset = 50,
  className,
  ...props
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, offset]);

  return (
    <motion.div
      className={className}
      style={{ y }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// SMOOTH SCROLL COMPONENTS
// ============================================================================

/**
 * Smooth scroll link component with accessibility support
 */
export const SmoothScrollLink: React.FC<SmoothScrollLinkProps> = ({
  href,
  children,
  className,
  offset = 0,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

/**
 * Hook for smooth scrolling to elements
 */
export const useSmoothScroll = () => {
  const scrollToElement = (elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return { scrollToElement };
};

// ============================================================================
// SCROLL PROGRESS INDICATOR
// ============================================================================

/**
 * Reading progress indicator component
 */
export const ScrollProgressIndicator: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-success z-50 ${className}`}
      style={{
        scaleX: scrollYProgress,
        transformOrigin: '0%'
      }}
    />
  );
};

// ============================================================================
// MARKETING-SPECIFIC ANIMATION COMPONENTS
// ============================================================================

/**
 * Hero section reveal with sequential animations
 */
export const HeroReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const variants = withReducedMotion({
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  });

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

/**
 * Feature card grid with staggered entrance
 */
export const FeatureGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const containerVariants = withReducedMotion({
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  });

  const itemVariants = withReducedMotion({
    initial: { opacity: 0, y: 30, scale: 0.9 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  });

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-10%' }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Statistics counter with animated reveal
 */
export const AnimatedStats: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const containerVariants = withReducedMotion({
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  });

  const statVariants = withReducedMotion({
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1] // Back easing
      }
    }
  });

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-20%' }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={statVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * CTA section with attention-grabbing animation
 */
export const CTAReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const variants = withReducedMotion({
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  });

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-15%' }}
    >
      {children}
    </motion.div>
  );
};

export default {
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
};