/**
 * Card Components
 * Glassmorphism-styled card components with variants for different use cases
 * Based on Think Tank Technologies Landing Page Design System
 */

import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import type { CardProps, BaseComponentProps, AnimationVariant } from '../../lib/types';

/**
 * Base Card component with glassmorphism styling
 * 
 * @example
 * ```tsx
 * // Basic glass card
 * <Card>
 *   <Card.Header>
 *     <h3>Card Title</h3>
 *   </Card.Header>
 *   <Card.Body>
 *     Card content goes here
 *   </Card.Body>
 * </Card>
 * 
 * // Feature card
 * <Card variant="feature" hoverable>
 *   <FeatureIcon />
 *   <h3>Feature Title</h3>
 *   <p>Feature description</p>
 * </Card>
 * 
 * // Pricing card
 * <Card variant="pricing" popular>
 *   <PricingContent />
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'glass',
      hoverable = false,
      popular = false,
      animation = 'none',
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Variant classes
    const variantClasses = {
      glass: 'ttt-card-glass',
      feature: 'ttt-card-feature',
      pricing: cn('ttt-card-pricing', { popular: popular }),
    };

    // Animation classes
    const animationClasses = {
      'fade-in': 'ttt-fade-in',
      'slide-up': 'ttt-slide-up',
      'scale-in': 'ttt-scale-in',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          animationClasses[animation],
          {
            'transition-transform hover:scale-105': hoverable && variant !== 'feature',
            'cursor-pointer': hoverable,
          },
          className
        )}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header component
 */
export interface CardHeaderProps extends BaseComponentProps {
  children: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, 'data-testid': testId, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('card-header', className)}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Body component
 */
export interface CardBodyProps extends BaseComponentProps {
  children: React.ReactNode;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, 'data-testid': testId, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('card-body', className)}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

/**
 * Feature Card - Specialized card for feature showcases
 */
export interface FeatureCardProps extends Omit<CardProps, 'variant'> {
  /** Feature icon */
  icon?: React.ReactNode;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Link to feature details */
  href?: string;
  /** Demo component */
  demo?: React.ReactNode;
  /** List of benefits */
  benefits?: string[];
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      className,
      icon,
      title,
      description,
      href,
      demo,
      benefits,
      hoverable = true,
      animation = 'fade-in',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const CardContent = (
      <>
        {icon && (
          <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-xl bg-brand-primary/10 text-brand-primary group-hover:text-success-light transition-colors">
            {icon}
          </div>
        )}
        
        <h3 className="ttt-heading-3 mb-4 group-hover:text-white transition-colors">
          {title}
        </h3>
        
        <p className="ttt-text-body mb-6 leading-relaxed">
          {description}
        </p>
        
        {benefits && benefits.length > 0 && (
          <ul className="space-y-2 mb-6">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center text-sm text-text-secondary">
                <svg
                  className="w-4 h-4 mr-3 text-success flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        )}
        
        {demo && (
          <div className="mt-6 p-4 rounded-lg bg-surface-elevated border border-border">
            {demo}
          </div>
        )}
      </>
    );

    if (href) {
      return (
        <Card
          ref={ref}
          variant="feature"
          hoverable={hoverable}
          animation={animation}
          className={cn('group', className)}
          data-testid={testId}
          {...props}
        >
          <a href={href} className="block h-full">
            {CardContent}
            <div className="mt-6 flex items-center text-brand-primary group-hover:text-success-light transition-colors">
              <span className="text-sm font-medium">Learn more</span>
              <svg
                className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </a>
        </Card>
      );
    }

    return (
      <Card
        ref={ref}
        variant="feature"
        hoverable={hoverable}
        animation={animation}
        className={cn('group', className)}
        data-testid={testId}
        {...props}
      >
        {CardContent}
      </Card>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';

/**
 * Pricing Card - Specialized card for pricing plans
 */
export interface PricingCardProps extends Omit<CardProps, 'variant'> {
  /** Plan name */
  name: string;
  /** Plan description */
  description: string;
  /** Price amount */
  price: string;
  /** Price period */
  period?: string;
  /** List of features */
  features: string[];
  /** CTA button text */
  ctaText: string;
  /** CTA button action */
  onCtaClick?: () => void;
  /** CTA button href */
  ctaHref?: string;
  /** Is popular plan */
  popular?: boolean;
}

export const PricingCard = forwardRef<HTMLDivElement, PricingCardProps>(
  (
    {
      className,
      name,
      description,
      price,
      period,
      features,
      ctaText,
      onCtaClick,
      ctaHref,
      popular = false,
      animation = 'fade-in',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        variant="pricing"
        popular={popular}
        animation={animation}
        className={cn('relative', className)}
        data-testid={testId}
        {...props}
      >
        {popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-brand-primary to-success-light text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
        )}
        
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="ttt-heading-3 mb-2">{name}</h3>
            <p className="ttt-text-small mb-6">{description}</p>
            
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-5xl font-bold text-white">{price}</span>
              {period && (
                <span className="text-text-muted ml-2">{period}</span>
              )}
            </div>
          </div>
          
          {/* Features */}
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-text-secondary">
                <svg
                  className="w-5 h-5 mr-3 text-success flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          
          {/* CTA */}
          {ctaHref ? (
            <a
              href={ctaHref}
              className={cn(
                'ttt-btn w-full justify-center',
                popular ? 'ttt-btn-primary' : 'ttt-btn-secondary'
              )}
            >
              {ctaText}
            </a>
          ) : (
            <button
              onClick={onCtaClick}
              className={cn(
                'ttt-btn w-full justify-center',
                popular ? 'ttt-btn-primary' : 'ttt-btn-secondary'
              )}
            >
              {ctaText}
            </button>
          )}
        </div>
      </Card>
    );
  }
);

PricingCard.displayName = 'PricingCard';

/**
 * Stat Card - Specialized card for displaying statistics
 */
export interface StatCardProps extends Omit<CardProps, 'variant' | 'children'> {
  /** Statistic number */
  number: string;
  /** Statistic label */
  label: string;
  /** Statistic description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Trend indicator */
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      number,
      label,
      description,
      icon,
      trend,
      animation = 'fade-in',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        variant="glass"
        animation={animation}
        className={cn('card-stat text-center', className)}
        data-testid={testId}
        {...props}
      >
        <div className="p-6">
          {icon && (
            <div className="mb-4 flex justify-center">
              <div className="p-3 rounded-lg bg-brand-primary/10 text-brand-primary">
                {icon}
              </div>
            </div>
          )}
          
          <div className="mb-2">
            <span className="text-3xl font-bold text-white">{number}</span>
            {trend && (
              <span
                className={cn('ml-2 text-sm font-medium', {
                  'text-success': trend.direction === 'up',
                  'text-error': trend.direction === 'down',
                })}
              >
                {trend.direction === 'up' ? '↗' : '↘'} {trend.value}
              </span>
            )}
          </div>
          
          <div className="text-text-secondary font-medium">{label}</div>
          
          {description && (
            <div className="mt-2 text-sm text-text-muted">{description}</div>
          )}
        </div>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';

// Compose Card with sub-components
Card.Header = CardHeader;
Card.Body = CardBody;

export { FeatureCard, PricingCard, StatCard };
export default Card;