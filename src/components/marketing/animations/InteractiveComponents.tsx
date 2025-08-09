/**
 * Interactive Animation Components
 * Enhanced UI components with smooth Framer Motion interactions
 * Built for marketing pages with accessibility and performance focus
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Button } from '../../ui/Button';
import { 
  buttonVariants,
  cardHoverVariants,
  scaleVariants,
  createGlowEffect,
  withReducedMotion,
  ANIMATION_TOKENS
} from '../../../lib/animations';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnimatedButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  glowEffect?: boolean;
  pressEffect?: boolean;
  hoverScale?: number;
}

interface AnimatedCardProps extends Omit<MotionProps, 'variants'> {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
  glowEffect?: boolean;
  borderGlow?: boolean;
}

interface InteractiveIconProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  rotateOnHover?: boolean;
  pulseOnHover?: boolean;
}

interface HoverRevealProps {
  children: React.ReactNode;
  revealContent: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

// ============================================================================
// ENHANCED BUTTON COMPONENTS
// ============================================================================

/**
 * Animated button with enhanced interactions
 */
export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, glowEffect = false, pressEffect = true, hoverScale = 1.05, ...props }, ref) => {
    const variants = withReducedMotion({
      initial: { scale: 1 },
      whileHover: {
        scale: hoverScale,
        transition: {
          duration: ANIMATION_TOKENS.duration.fast / 1000,
          ease: ANIMATION_TOKENS.easing.easeOut
        }
      },
      whileTap: pressEffect ? {
        scale: 0.95,
        transition: {
          duration: ANIMATION_TOKENS.duration.fast / 1000
        }
      } : {}
    });

    const glowVariants = glowEffect ? createGlowEffect() : {};

    return (
      <motion.div
        variants={variants}
        initial="initial"
        whileHover="whileHover"
        whileTap="whileTap"
        {...glowVariants}
      >
        <Button 
          ref={ref}
          className={className}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

/**
 * CTA button with special effects
 */
export const CTAButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <AnimatedButton
      className={`relative overflow-hidden ${className}`}
      glowEffect
      hoverScale={1.02}
      {...props}
    >
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
        whileHover={{
          translateX: '100%',
          transition: { duration: 0.6, ease: 'easeInOut' }
        }}
      />
      <span className="relative z-10">{children}</span>
    </AnimatedButton>
  );
};

// ============================================================================
// ENHANCED CARD COMPONENTS
// ============================================================================

/**
 * Animated card with hover effects
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  hoverLift = true,
  glowEffect = false,
  borderGlow = false,
  ...props
}) => {
  const variants = withReducedMotion({
    initial: { 
      scale: 1,
      y: 0,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    whileHover: {
      scale: hoverLift ? 1.02 : 1,
      y: hoverLift ? -8 : 0,
      boxShadow: hoverLift 
        ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderColor: borderGlow ? 'var(--brand-primary)' : undefined,
      transition: {
        duration: ANIMATION_TOKENS.duration.normal / 1000,
        ease: ANIMATION_TOKENS.easing.easeOut
      }
    }
  });

  const glowVariants = glowEffect ? createGlowEffect() : {};

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      whileHover="whileHover"
      {...glowVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Feature card with special interactions
 */
export const FeatureCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}> = ({ children, className, icon, title, description }) => {
  return (
    <AnimatedCard 
      className={`${className} group cursor-pointer`}
      hoverLift
      borderGlow
    >
      {icon && (
        <motion.div 
          className="mb-4"
          whileHover={{ 
            scale: 1.1, 
            rotate: 5,
            transition: { duration: 0.3 }
          }}
        >
          {icon}
        </motion.div>
      )}
      
      {title && (
        <motion.h3 
          className="text-lg font-semibold mb-2 text-white"
          whileHover={{ color: 'var(--brand-primary)' }}
        >
          {title}
        </motion.h3>
      )}
      
      {description && (
        <p className="text-text-secondary mb-4">
          {description}
        </p>
      )}
      
      {children}
    </AnimatedCard>
  );
};

// ============================================================================
// INTERACTIVE ICON COMPONENTS
// ============================================================================

/**
 * Interactive icon with hover animations
 */
export const InteractiveIcon: React.FC<InteractiveIconProps> = ({
  children,
  className,
  size = 'md',
  rotateOnHover = false,
  pulseOnHover = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const variants = withReducedMotion({
    initial: { rotate: 0, scale: 1 },
    whileHover: {
      rotate: rotateOnHover ? 15 : 0,
      scale: pulseOnHover ? 1.2 : 1.1,
      transition: {
        duration: ANIMATION_TOKENS.duration.normal / 1000,
        ease: ANIMATION_TOKENS.easing.easeOut
      }
    }
  });

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      variants={variants}
      initial="initial"
      whileHover="whileHover"
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// HOVER REVEAL COMPONENTS
// ============================================================================

/**
 * Content that reveals on hover
 */
export const HoverReveal: React.FC<HoverRevealProps> = ({
  children,
  revealContent,
  className,
  direction = 'up'
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const slideVariants = {
    up: { y: '100%' },
    down: { y: '-100%' },
    left: { x: '100%' },
    right: { x: '-100%' }
  };

  const revealVariants = withReducedMotion({
    initial: slideVariants[direction],
    animate: {
      x: 0,
      y: 0,
      transition: {
        duration: ANIMATION_TOKENS.duration.normal / 1000,
        ease: ANIMATION_TOKENS.easing.easeOut
      }
    },
    exit: slideVariants[direction]
  });

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{ opacity: isHovered ? 0.3 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
      
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        variants={revealVariants}
        initial="initial"
        animate={isHovered ? "animate" : "initial"}
        exit="exit"
      >
        {revealContent}
      </motion.div>
    </div>
  );
};

// ============================================================================
// LOADING INTERACTIVE COMPONENTS
// ============================================================================

/**
 * Interactive loading button
 */
export const LoadingButton: React.FC<{
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ children, isLoading = false, className, disabled, onClick }) => {
  return (
    <AnimatedButton
      className={className}
      disabled={disabled || isLoading}
      onClick={onClick}
      pressEffect={!isLoading}
    >
      <motion.div className="flex items-center justify-center gap-2">
        {isLoading && (
          <motion.div
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        <span>{children}</span>
      </motion.div>
    </AnimatedButton>
  );
};

// ============================================================================
// FLOATING ACTION COMPONENTS
// ============================================================================

/**
 * Floating action button with animations
 */
export const FloatingActionButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => {
  const variants = withReducedMotion({
    initial: { scale: 1, y: 0 },
    whileHover: {
      scale: 1.1,
      y: -2,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
      transition: { duration: 0.3 }
    },
    whileTap: {
      scale: 0.95,
      y: 0
    }
  });

  return (
    <motion.button
      className={`rounded-full p-4 bg-brand-primary text-white shadow-lg ${className}`}
      variants={variants}
      initial="initial"
      whileHover="whileHover"
      whileTap="whileTap"
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

// ============================================================================
// TOOLTIP COMPONENTS
// ============================================================================

/**
 * Animated tooltip
 */
export const AnimatedTooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}> = ({ children, content, position = 'top', className }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <motion.div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap ${positionStyles[position]}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1/2 top-full left-1/2" />
        </motion.div>
      )}
    </div>
  );
};

export default {
  AnimatedButton,
  CTAButton,
  AnimatedCard,
  FeatureCard,
  InteractiveIcon,
  HoverReveal,
  LoadingButton,
  FloatingActionButton,
  AnimatedTooltip,
};