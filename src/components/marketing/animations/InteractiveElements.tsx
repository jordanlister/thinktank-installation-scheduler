/**
 * Interactive Elements with Micro-animations
 * Sophisticated micro-interactions for marketing components
 * Includes cards, buttons, forms, and other interactive elements
 */

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// ANIMATED FEATURE CARD
// ============================================================================

interface AnimatedFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  delay?: number;
  children?: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const AnimatedFeatureCard: React.FC<AnimatedFeatureCardProps> = ({
  icon,
  title,
  description,
  href,
  delay = 0,
  children,
  className,
  glowColor = 'var(--brand-primary)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entries[0].target);
        }
      },
      { threshold: 0.1, rootMargin: '-50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const Card = href ? 'a' : 'div';

  return (
    <Card
      ref={cardRef}
      href={href}
      className={cn(
        'group relative p-8 bg-surface-glass backdrop-blur-xl border border-border rounded-xl',
        'transition-all duration-500 ease-out transform',
        'hover:scale-105 hover:bg-surface-glass/80 hover:border-brand-primary/30',
        'hover:shadow-glass-lg hover:shadow-glow',
        'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-background',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8',
        href && 'cursor-pointer',
        className
      )}
      style={{
        transitionDelay: isVisible ? '0ms' : `${delay}ms`,
        boxShadow: `var(--shadow-lg), 0 0 0 ${glowColor}00`,
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Icon with animation */}
      <div className="relative z-10 mb-6">
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-brand-primary/10 group-hover:bg-brand-primary/20 transition-colors duration-300 group-hover:scale-110 transform">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-semibold text-text-primary mb-4 group-hover:text-white transition-colors duration-300">
          {title}
        </h3>
        <p className="text-text-secondary group-hover:text-text-primary transition-colors duration-300 leading-relaxed">
          {description}
        </p>
        {children}
      </div>

      {/* Hover arrow */}
      {href && (
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <svg
            className="w-5 h-5 text-brand-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 17l9.2-9.2M17 17V7H7"
            />
          </svg>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// ANIMATED BUTTON
// ============================================================================

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glowEffect?: boolean;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'right',
  glowEffect = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-brand-primary hover:bg-success-light text-white border-transparent hover:border-success-light/30',
    secondary: 'bg-surface-glass border-border-light hover:border-brand-primary/50 text-text-primary hover:bg-brand-primary/10',
    ghost: 'text-brand-primary hover:text-success-light border-transparent hover:bg-brand-primary/10',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200 ease-out transform',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'shadow-lg hover:shadow-xl',
        'border backdrop-blur-sm',
        variants[variant],
        sizes[size],
        glowEffect && 'hover-glow',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Button content */}
      <div className={cn('flex items-center gap-2', loading && 'opacity-0')}>
        {icon && iconPosition === 'left' && (
          <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
            {icon}
          </span>
        )}
        
        <span>{children}</span>
        
        {icon && iconPosition === 'right' && (
          <span className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1">
            {icon}
          </span>
        )}
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 cta-glow pointer-events-none" />
    </button>
  );
};

// ============================================================================
// ANIMATED INPUT
// ============================================================================

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  success?: boolean;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error,
  icon,
  success,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
  };

  return (
    <div className="relative">
      {/* Input container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted transition-colors duration-200">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          className={cn(
            'w-full px-4 py-3 bg-surface-glass backdrop-blur-sm border border-border rounded-lg',
            'text-text-primary placeholder-text-muted',
            'transition-all duration-200 ease-out',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary',
            'focus:bg-surface-elevated focus:shadow-lg',
            icon && 'pl-10',
            error && 'border-error focus:ring-error',
            success && 'border-success focus:ring-success',
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {/* Floating label */}
        {label && (
          <label
            className={cn(
              'absolute left-3 transition-all duration-200 ease-out pointer-events-none',
              'text-text-muted',
              icon && 'left-10',
              isFocused || hasValue
                ? 'top-1 text-xs text-brand-primary'
                : 'top-1/2 transform -translate-y-1/2 text-base'
            )}
          >
            {label}
          </label>
        )}

        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {error && (
            <div className="w-5 h-5 text-error">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {success && (
            <div className="w-5 h-5 text-success">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-error animate-fade-in-up">
          {error}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ANIMATED STAT CARD
// ============================================================================

interface AnimatedStatCardProps {
  number: string | number;
  label: string;
  description?: string;
  suffix?: string;
  prefix?: string;
  delay?: number;
  className?: string;
}

export const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  number,
  label,
  description,
  suffix = '',
  prefix = '',
  delay = 0,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entries[0].target);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'text-center p-6 rounded-xl bg-surface-glass backdrop-blur-sm border border-border',
        'transition-all duration-700 ease-out transform',
        'hover:scale-105 hover:bg-surface-elevated hover:border-brand-primary/30',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8',
        className
      )}
      style={{
        transitionDelay: isVisible ? '0ms' : `${delay}ms`,
      }}
    >
      <div className="text-3xl md:text-4xl font-bold text-brand-primary mb-2">
        {typeof number === 'number' ? (
          <span>
            {prefix}
            <span className="tabular-nums">{number.toLocaleString()}</span>
            {suffix}
          </span>
        ) : (
          `${prefix}${number}${suffix}`
        )}
      </div>
      <div className="text-lg font-medium text-text-primary mb-1">
        {label}
      </div>
      {description && (
        <div className="text-sm text-text-muted">
          {description}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ANIMATED TESTIMONIAL CARD
// ============================================================================

interface AnimatedTestimonialCardProps {
  quote: string;
  author: string;
  title: string;
  company: string;
  avatar?: string;
  companyLogo?: string;
  delay?: number;
  className?: string;
}

export const AnimatedTestimonialCard: React.FC<AnimatedTestimonialCardProps> = ({
  quote,
  author,
  title,
  company,
  avatar,
  companyLogo,
  delay = 0,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entries[0].target);
        }
      },
      { threshold: 0.1, rootMargin: '-50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative p-8 bg-surface-glass backdrop-blur-xl border border-border rounded-xl',
        'transition-all duration-700 ease-out transform',
        'hover:scale-105 hover:shadow-glass-lg hover:border-brand-primary/30',
        isVisible
          ? 'opacity-100 translate-y-0 rotate-0'
          : 'opacity-0 translate-y-8 rotate-1',
        className
      )}
      style={{
        transitionDelay: isVisible ? '0ms' : `${delay}ms`,
      }}
    >
      {/* Quote */}
      <div className="text-lg text-text-primary mb-6 leading-relaxed italic">
        "{quote}"
      </div>

      {/* Author info */}
      <div className="flex items-center gap-4">
        {avatar && (
          <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border overflow-hidden">
            <img
              src={avatar}
              alt={author}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="font-semibold text-text-primary">{author}</div>
          <div className="text-sm text-text-secondary">{title}</div>
          <div className="text-sm text-text-muted">{company}</div>
        </div>
        {companyLogo && (
          <div className="w-16 h-8 opacity-60">
            <img
              src={companyLogo}
              alt={company}
              className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Decorative quote mark */}
      <div className="absolute top-4 right-6 text-brand-primary/20 text-4xl font-serif">
        "
      </div>
    </div>
  );
};

// ============================================================================
// SCROLL REVEAL CONTAINER
// ============================================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  className,
  threshold = 0.1,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entries[0].target);
        }
      },
      { threshold, rootMargin: '-30px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, threshold]);

  const directionClasses = {
    up: isVisible ? 'translate-y-0' : 'translate-y-8',
    down: isVisible ? 'translate-y-0' : '-translate-y-8',
    left: isVisible ? 'translate-x-0' : 'translate-x-8',
    right: isVisible ? 'translate-x-0' : '-translate-x-8',
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all ease-out transform',
        isVisible ? 'opacity-100' : 'opacity-0',
        directionClasses[direction],
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: isVisible ? '0ms' : `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Components are individually exported above