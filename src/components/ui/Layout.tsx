/**
 * Layout Components
 * Responsive layout components for consistent page structure
 * Based on Think Tank Technologies Landing Page Design System
 */

import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import type { ContainerProps, GridProps, BaseComponentProps } from '../../lib/types';

/**
 * Container component for consistent max-width and centering
 * 
 * @example
 * ```tsx
 * // Basic container
 * <Container>
 *   <h1>Page Content</h1>
 * </Container>
 * 
 * // With custom max width
 * <Container maxWidth="lg">
 *   <Section>Content here</Section>
 * </Container>
 * 
 * // Full width container
 * <Container maxWidth="full">
 *   <WideContent />
 * </Container>
 * ```
 */
const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className,
      maxWidth = 'xl',
      center = true,
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const maxWidthClasses = {
      sm: 'max-w-screen-sm', // 640px
      md: 'max-w-screen-md', // 768px
      lg: 'max-w-screen-lg', // 1024px
      xl: 'max-w-screen-xl', // 1280px
      '2xl': 'max-w-screen-2xl', // 1536px
      '3xl': 'max-w-[1600px]', // Custom large size
      full: 'max-w-none',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'ttt-container',
          maxWidthClasses[maxWidth],
          {
            'mx-auto': center,
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

Container.displayName = 'Container';

/**
 * Section component for consistent vertical spacing
 */
export interface SectionProps extends BaseComponentProps {
  children: React.ReactNode;
  /** Vertical padding size */
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Background variant */
  background?: 'transparent' | 'surface' | 'elevated' | 'gradient';
  /** Custom background color */
  backgroundColor?: string;
  /** Full viewport height */
  fullHeight?: boolean;
  /** Section element or custom element */
  as?: keyof JSX.IntrinsicElements;
}

const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      children,
      spacing = 'lg',
      background = 'transparent',
      backgroundColor,
      fullHeight = false,
      as = 'section',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const Component = as as keyof JSX.IntrinsicElements;

    const spacingClasses = {
      none: '',
      sm: 'py-8',
      md: 'py-12',
      lg: 'ttt-section', // py-20
      xl: 'py-32',
    };

    const backgroundClasses = {
      transparent: '',
      surface: 'bg-surface',
      elevated: 'bg-surface-elevated',
      gradient: 'bg-gradient-to-br from-background via-surface to-surface-elevated',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          spacingClasses[spacing],
          backgroundClasses[background],
          {
            'min-h-screen flex items-center': fullHeight,
          },
          className
        )}
        style={backgroundColor ? { backgroundColor } : undefined}
        data-testid={testId}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Section.displayName = 'Section';

/**
 * Grid component for responsive layouts
 */
const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className,
      cols = 1,
      responsive,
      gap = 'md',
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const gapClasses = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-8',
      lg: 'gap-12',
      xl: 'gap-16',
    };

    // Base column classes
    const colClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    };

    // Generate responsive classes if provided
    let responsiveClasses = '';
    if (responsive) {
      const breakpoints = Object.entries(responsive);
      responsiveClasses = breakpoints
        .map(([breakpoint, colCount]) => {
          if (breakpoint === 'sm') return `sm:grid-cols-${colCount}`;
          if (breakpoint === 'md') return `md:grid-cols-${colCount}`;
          if (breakpoint === 'lg') return `lg:grid-cols-${colCount}`;
          if (breakpoint === 'xl') return `xl:grid-cols-${colCount}`;
          return '';
        })
        .filter(Boolean)
        .join(' ');
    }

    return (
      <div
        ref={ref}
        className={cn(
          'ttt-grid',
          responsive ? `grid-cols-1 ${responsiveClasses}` : colClasses[cols],
          gapClasses[gap],
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

Grid.displayName = 'Grid';

/**
 * Flexbox component for flexible layouts
 */
export interface FlexProps extends BaseComponentProps {
  children: React.ReactNode;
  /** Flex direction */
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  /** Justify content */
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  /** Align items */
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  /** Gap between items */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Flex wrap */
  wrap?: boolean;
  /** Custom element type */
  as?: keyof JSX.IntrinsicElements;
}

const Flex = forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      className,
      children,
      direction = 'row',
      justify = 'start',
      align = 'stretch',
      gap = 'md',
      wrap = false,
      as = 'div',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const Component = as as keyof JSX.IntrinsicElements;

    const directionClasses = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    };

    const justifyClasses = {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    const alignClasses = {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    };

    const gapClasses = {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          justifyClasses[justify],
          alignClasses[align],
          gapClasses[gap],
          {
            'flex-wrap': wrap,
          },
          className
        )}
        data-testid={testId}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Flex.displayName = 'Flex';

/**
 * Stack component for vertical layouts with consistent spacing
 */
export interface StackProps extends BaseComponentProps {
  children: React.ReactNode;
  /** Space between children */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Horizontal alignment */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Divider between items */
  divider?: React.ReactNode;
}

const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      children,
      spacing = 'md',
      align = 'stretch',
      divider,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8',
    };

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };

    const childrenArray = React.Children.toArray(children);

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          !divider && spacingClasses[spacing],
          alignClasses[align],
          className
        )}
        data-testid={testId}
        {...props}
      >
        {divider
          ? childrenArray.map((child, index) => (
              <React.Fragment key={index}>
                {child}
                {index < childrenArray.length - 1 && (
                  <div className="py-2">{divider}</div>
                )}
              </React.Fragment>
            ))
          : children}
      </div>
    );
  }
);

Stack.displayName = 'Stack';

/**
 * Spacer component for adding space between elements
 */
export interface SpacerProps extends BaseComponentProps {
  /** Size of the spacer */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Direction of the spacer */
  direction?: 'horizontal' | 'vertical';
}

const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  (
    {
      className,
      size = 'md',
      direction = 'vertical',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      vertical: {
        xs: 'h-1',
        sm: 'h-2',
        md: 'h-4',
        lg: 'h-8',
        xl: 'h-16',
        '2xl': 'h-24',
        '3xl': 'h-32',
      },
      horizontal: {
        xs: 'w-1',
        sm: 'w-2',
        md: 'w-4',
        lg: 'w-8',
        xl: 'w-16',
        '2xl': 'w-24',
        '3xl': 'w-32',
      },
    };

    return (
      <div
        ref={ref}
        className={cn(sizeClasses[direction][size], className)}
        data-testid={testId}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Spacer.displayName = 'Spacer';

/**
 * Center component for centering content
 */
export interface CenterProps extends BaseComponentProps {
  children: React.ReactNode;
  /** Centering method */
  method?: 'flex' | 'grid';
  /** Custom element type */
  as?: keyof JSX.IntrinsicElements;
}

const Center = forwardRef<HTMLDivElement, CenterProps>(
  (
    {
      className,
      children,
      method = 'flex',
      as = 'div',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const Component = as as keyof JSX.IntrinsicElements;

    const methodClasses = {
      flex: 'flex items-center justify-center',
      grid: 'grid place-items-center',
    };

    return (
      <Component
        ref={ref}
        className={cn(methodClasses[method], className)}
        data-testid={testId}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Center.displayName = 'Center';

export { Container as default, Section, Grid, Flex, Stack, Spacer, Center };