/**
 * Button Component
 * Accessible, typed button component with multiple variants and sizes
 * Based on Think Tank Technologies Landing Page Design System
 */

import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';
import type { ButtonProps } from '../../lib/types';

/**
 * Primary button component with multiple variants, sizes, and accessibility features
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * // With variant and size
 * <Button variant="primary" size="lg">Get Started</Button>
 * 
 * // With icons
 * <Button leftIcon={<ArrowRight />} variant="secondary">
 *   Continue
 * </Button>
 * 
 * // Loading state
 * <Button loading disabled>Processing...</Button>
 * 
 * // As child (polymorphic)
 * <Button asChild>
 *   <Link to="/signup">Sign Up</Link>
 * </Button>
 * ```
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      asChild = false,
      disabled,
      children,
      type = 'button',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    
    // Base button classes
    const baseClasses = 'ttt-btn';
    
    // Variant classes
    const variantClasses = {
      primary: 'ttt-btn-primary',
      secondary: 'ttt-btn-secondary',
      ghost: 'ttt-btn-ghost',
      danger: 'btn-danger', // Using existing danger class from index.css
    };
    
    // Size classes
    const sizeClasses = {
      xs: 'ttt-btn-xs',
      sm: 'ttt-btn-sm',
      md: '', // Default size
      lg: 'ttt-btn-lg',
      xl: 'ttt-btn-xl',
    };
    
    // Additional classes
    const additionalClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      {
        'w-full': fullWidth,
        'cursor-not-allowed opacity-50': disabled || loading,
      },
      className
    );

    // Icon wrapper classes
    const iconClasses = cn('flex-shrink-0', {
      'w-4 h-4': size === 'sm' || size === 'xs',
      'w-5 h-5': size === 'md',
      'w-6 h-6': size === 'lg' || size === 'xl',
    });

    const LoadingSpinner = () => (
      <svg
        className={cn('animate-spin', iconClasses)}
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <Comp
        ref={ref}
        type={type}
        className={additionalClasses}
        disabled={disabled || loading}
        data-testid={testId}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <LoadingSpinner />
        )}
        
        {!loading && leftIcon && (
          <span className={cn(iconClasses, { 'mr-2': children })}>
            {leftIcon}
          </span>
        )}
        
        {children && (
          <span className={cn({ 'ml-2': loading && !leftIcon })}>
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className={cn(iconClasses, { 'ml-2': children })}>
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

/**
 * Button Group component for grouping related buttons
 */
export interface ButtonGroupProps {
  className?: string;
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, children, orientation = 'horizontal', size = 'md', 'data-testid': testId }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex',
          {
            'flex-row': orientation === 'horizontal',
            'flex-col': orientation === 'vertical',
            'rounded-lg overflow-hidden': true,
          },
          className
        )}
        data-testid={testId}
        role="group"
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && child.type === Button) {
            return React.cloneElement(child, {
              size,
              className: cn(
                child.props.className,
                orientation === 'horizontal' && index > 0 && 'rounded-l-none border-l-0',
                orientation === 'horizontal' && index < React.Children.count(children) - 1 && 'rounded-r-none',
                orientation === 'vertical' && index > 0 && 'rounded-t-none border-t-0',
                orientation === 'vertical' && index < React.Children.count(children) - 1 && 'rounded-b-none'
              ),
            });
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

/**
 * Icon Button component for icon-only buttons
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string; // Required for accessibility
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'md', 'aria-label': ariaLabel, ...props }, ref) => {
    const sizeClasses = {
      xs: 'w-8 h-8',
      sm: 'w-9 h-9',
      md: 'w-10 h-10',
      lg: 'w-11 h-11',
      xl: 'w-12 h-12',
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'p-0',
          sizeClasses[size],
          className
        )}
        size={size}
        aria-label={ariaLabel}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };
export { Button };
export default Button;