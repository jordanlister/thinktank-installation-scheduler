/**
 * Motion Wrapper Components
 * Reusable motion wrappers for consistent marketing page animations
 * Built with Framer Motion and accessibility support
 */

import React from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  MarketingPageTransition,
  SectionTransition,
  LoadingTransition,
  usePageLoading
} from './PageTransitions';
import {
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  ScrollProgressIndicator
} from './ScrollAnimations';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MarketingPageWrapperProps {
  children: React.ReactNode;
  className?: string;
  showProgressIndicator?: boolean;
  enablePageTransition?: boolean;
}

interface MarketingSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  background?: 'transparent' | 'subtle' | 'elevated';
  padding?: 'none' | 'normal' | 'large';
  reveal?: boolean;
  stagger?: boolean;
}

interface HeroSectionProps {
  children: React.ReactNode;
  className?: string;
  backgroundImage?: string;
  backgroundOverlay?: boolean;
  gradientBackground?: boolean;
}

interface ContentSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
  maxWidth?: 'none' | 'prose' | 'container';
}

interface FeatureSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  columns?: 2 | 3 | 4;
  staggerDelay?: number;
}

// ============================================================================
// MAIN PAGE WRAPPER
// ============================================================================

/**
 * Complete page wrapper with transitions and progress indicator
 */
export const MarketingPageWrapper: React.FC<MarketingPageWrapperProps> = ({
  children,
  className,
  showProgressIndicator = true,
  enablePageTransition = true
}) => {
  const { isLoading } = usePageLoading();

  const content = (
    <div className={`min-h-screen ${className || ''}`}>
      {showProgressIndicator && <ScrollProgressIndicator />}
      <LoadingTransition isLoading={isLoading}>
        {children}
      </LoadingTransition>
    </div>
  );

  if (enablePageTransition) {
    return (
      <MarketingPageTransition>
        {content}
      </MarketingPageTransition>
    );
  }

  return content;
};

// ============================================================================
// SECTION WRAPPERS
// ============================================================================

/**
 * Generic marketing section with consistent styling and animations
 */
export const MarketingSection: React.FC<MarketingSectionProps> = ({
  children,
  className,
  delay = 0,
  background = 'transparent',
  padding = 'normal',
  reveal = true,
  stagger = false
}) => {
  const backgroundClasses = {
    transparent: '',
    subtle: 'bg-surface/50',
    elevated: 'bg-surface-elevated'
  };

  const paddingClasses = {
    none: '',
    normal: 'py-12 md:py-16 lg:py-20',
    large: 'py-16 md:py-24 lg:py-32'
  };

  const sectionClasses = `
    ${backgroundClasses[background]}
    ${paddingClasses[padding]}
    ${className || ''}
  `.trim();

  const content = stagger ? (
    <StaggerGroup>
      {React.Children.map(children, (child, index) => (
        <StaggerItem key={index}>
          {child}
        </StaggerItem>
      ))}
    </StaggerGroup>
  ) : children;

  if (reveal) {
    return (
      <SectionTransition delay={delay} className={sectionClasses}>
        <div className="marketing-container">
          {content}
        </div>
      </SectionTransition>
    );
  }

  return (
    <section className={sectionClasses}>
      <div className="marketing-container">
        {content}
      </div>
    </section>
  );
};

// ============================================================================
// SPECIALIZED SECTION COMPONENTS
// ============================================================================

/**
 * Hero section wrapper with background effects
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  children,
  className,
  backgroundImage,
  backgroundOverlay = true,
  gradientBackground = true
}) => {
  const backgroundStyles = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {};

  return (
    <section 
      className={`marketing-hero relative overflow-hidden min-h-screen flex items-center ${className || ''}`}
      style={backgroundStyles}
    >
      {/* Background Effects */}
      {gradientBackground && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/30" />
      )}
      
      {backgroundOverlay && (
        <div className="absolute inset-0 bg-black/20" />
      )}
      
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 bg-subtle-dots opacity-10" />
      
      {/* Content */}
      <div className="marketing-container relative z-10 w-full">
        {children}
      </div>
    </section>
  );
};

/**
 * Content section with optional title and consistent spacing
 */
export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  title,
  subtitle,
  className,
  centered = false,
  maxWidth = 'container'
}) => {
  const maxWidthClasses = {
    none: '',
    prose: 'max-w-3xl',
    container: 'max-w-6xl'
  };

  const containerClasses = `
    ${maxWidthClasses[maxWidth]}
    ${centered ? 'mx-auto text-center' : ''}
    ${className || ''}
  `.trim();

  return (
    <MarketingSection>
      <div className={containerClasses}>
        {(title || subtitle) && (
          <ScrollReveal className="mb-12">
            {title && (
              <h2 className="ttt-section-header text-white mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="ttt-text-lead text-text-secondary">
                {subtitle}
              </p>
            )}
          </ScrollReveal>
        )}
        
        {children}
      </div>
    </MarketingSection>
  );
};

/**
 * Feature section with grid layout and staggered animations
 */
export const FeatureSection: React.FC<FeatureSectionProps> = ({
  children,
  title,
  subtitle,
  className,
  columns = 3,
  staggerDelay = 100
}) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <MarketingSection className={className}>
      {(title || subtitle) && (
        <ScrollReveal className="text-center mb-12">
          {title && (
            <h2 className="ttt-section-header text-white mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="ttt-text-lead text-text-secondary max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </ScrollReveal>
      )}
      
      <StaggerGroup className={`grid ${gridClasses[columns]} gap-6 lg:gap-8`}>
        {React.Children.map(children, (child, index) => (
          <StaggerItem key={index}>
            {child}
          </StaggerItem>
        ))}
      </StaggerGroup>
    </MarketingSection>
  );
};

// ============================================================================
// UTILITY WRAPPERS
// ============================================================================

/**
 * Container wrapper with consistent max-width and padding
 */
export const Container: React.FC<{
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}> = ({ children, className, size = 'lg' }) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className || ''}`}>
      {children}
    </div>
  );
};

/**
 * Grid wrapper with responsive columns
 */
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
  columns?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ 
  children, 
  className, 
  columns = { base: 1, md: 2, lg: 3 },
  gap = 'md'
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10'
  };

  const getGridCols = (cols: number) => {
    const gridMap: { [key: number]: string } = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6'
    };
    return gridMap[cols] || 'grid-cols-1';
  };

  const gridClasses = [
    'grid',
    columns.base && getGridCols(columns.base),
    columns.sm && `sm:${getGridCols(columns.sm)}`,
    columns.md && `md:${getGridCols(columns.md)}`,
    columns.lg && `lg:${getGridCols(columns.lg)}`,
    columns.xl && `xl:${getGridCols(columns.xl)}`,
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// ============================================================================
// LAYOUT MOTION COMPONENTS
// ============================================================================

/**
 * Animated layout component for responsive changes
 */
export const AnimatedLayout: React.FC<{
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
 * Fade-in wrapper for conditional content
 */
export const ConditionalFade: React.FC<{
  children: React.ReactNode;
  show: boolean;
  className?: string;
}> = ({ children, show, className }) => {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default {
  MarketingPageWrapper,
  MarketingSection,
  HeroSection,
  ContentSection,
  FeatureSection,
  Container,
  ResponsiveGrid,
  AnimatedLayout,
  ConditionalFade,
};