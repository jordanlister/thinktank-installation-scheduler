/**
 * Typography Components
 * Semantic typography components with proper hierarchy and styling
 * Based on Think Tank Technologies Landing Page Design System
 */

import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import type { TypographyProps, BaseComponentProps } from '../../lib/types';

/**
 * Heading component with semantic HTML and consistent styling
 * 
 * @example
 * ```tsx
 * // Different heading levels
 * <Heading variant="h1">Main Page Title</Heading>
 * <Heading variant="h2" color="brand">Section Title</Heading>
 * <Heading variant="h3" as="h2">Custom semantic level</Heading>
 * 
 * // With custom styling
 * <Heading variant="h1" align="center" className="mb-8">
 *   Centered Hero Title
 * </Heading>
 * ```
 */
const Heading = forwardRef<HTMLHeadingElement, TypographyProps>(
  (
    {
      className,
      variant = 'h2',
      color = 'primary',
      as,
      truncate = false,
      align = 'left',
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Determine the HTML element to render
    const Component = as || (variant as keyof JSX.IntrinsicElements);
    
    // Variant classes based on design system
    const variantClasses = {
      h1: 'ttt-heading-1',
      h2: 'ttt-heading-2',
      h3: 'ttt-heading-3',
      h4: 'text-xl font-semibold leading-tight',
      h5: 'text-lg font-semibold leading-tight',
      h6: 'text-base font-semibold leading-tight',
      body: 'ttt-text-body',
      lead: 'ttt-text-lead',
      small: 'ttt-text-small',
      code: 'font-mono text-sm',
    };

    // Color classes
    const colorClasses = {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      muted: 'text-text-muted',
      brand: 'text-brand-primary',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
    };

    // Alignment classes
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          variantClasses[variant],
          colorClasses[color],
          alignClasses[align],
          {
            'truncate': truncate,
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

Heading.displayName = 'Heading';

/**
 * Text component for body text and paragraphs
 */
export interface TextProps extends TypographyProps {
  /** Text size variant */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  /** Text weight */
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  /** Line height */
  leading?: 'tight' | 'normal' | 'relaxed' | 'loose';
}

const Text = forwardRef<HTMLParagraphElement, TextProps>(
  (
    {
      className,
      variant = 'body',
      color = 'secondary',
      size,
      weight,
      leading,
      as = 'p',
      truncate = false,
      align = 'left',
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const Component = as as keyof JSX.IntrinsicElements;

    // Base variant classes
    const variantClasses = {
      h1: 'ttt-heading-1',
      h2: 'ttt-heading-2', 
      h3: 'ttt-heading-3',
      h4: 'text-xl font-semibold',
      h5: 'text-lg font-semibold',
      h6: 'text-base font-semibold',
      body: 'ttt-text-body',
      lead: 'ttt-text-lead',
      small: 'ttt-text-small',
      code: 'font-mono text-sm',
    };

    // Size classes (override variant if specified)
    const sizeClasses = size ? {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    }[size] : '';

    // Weight classes
    const weightClasses = weight ? {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    }[weight] : '';

    // Leading classes
    const leadingClasses = leading ? {
      tight: 'leading-tight',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
      loose: 'leading-loose',
    }[leading] : '';

    // Color classes
    const colorClasses = {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      muted: 'text-text-muted',
      brand: 'text-brand-primary',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
    };

    // Alignment classes
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          !size && variantClasses[variant],
          sizeClasses,
          weightClasses,
          leadingClasses,
          colorClasses[color],
          alignClasses[align],
          {
            'truncate': truncate,
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

Text.displayName = 'Text';

/**
 * Code Block component for displaying code snippets
 */
export interface CodeBlockProps extends BaseComponentProps {
  /** Code content */
  children: string | React.ReactNode;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Code title */
  title?: string;
  /** Enable copy functionality */
  copyable?: boolean;
  /** Max height with scroll */
  maxHeight?: string;
}

const CodeBlock = forwardRef<HTMLPreElement, CodeBlockProps>(
  (
    {
      className,
      children,
      language,
      showLineNumbers = false,
      title,
      copyable = false,
      maxHeight,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false);

    const copyToClipboard = async () => {
      if (typeof children === 'string') {
        try {
          await navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      }
    };

    const codeLines = typeof children === 'string' ? children.split('\n') : [];

    return (
      <div className="relative group">
        {title && (
          <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-border rounded-t-lg">
            <span className="text-sm font-medium text-text-primary">{title}</span>
            {language && (
              <span className="text-xs text-text-muted uppercase tracking-wide">
                {language}
              </span>
            )}
          </div>
        )}
        
        <div className="relative">
          {copyable && (
            <button
              onClick={copyToClipboard}
              className={cn(
                'absolute top-3 right-3 p-2 rounded-lg transition-all duration-200',
                'bg-surface-glass hover:bg-surface-elevated',
                'text-text-muted hover:text-text-primary',
                'opacity-0 group-hover:opacity-100',
                'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-primary'
              )}
              aria-label={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          )}
          
          <pre
            ref={ref}
            className={cn(
              'ttt-code-block',
              !title && 'rounded-lg',
              title && 'rounded-t-none rounded-b-lg',
              'overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border',
              className
            )}
            style={{ maxHeight }}
            data-testid={testId}
            {...props}
          >
            <code className={cn(
              'block',
              language && `language-${language}`
            )}>
              {showLineNumbers && typeof children === 'string' ? (
                <table className="w-full">
                  <tbody>
                    {codeLines.map((line, index) => (
                      <tr key={index}>
                        <td className="pr-4 text-text-muted text-right select-none w-12">
                          {index + 1}
                        </td>
                        <td className="text-text-secondary">
                          {line || ' '}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                children
              )}
            </code>
          </pre>
        </div>
      </div>
    );
  }
);

CodeBlock.displayName = 'CodeBlock';

/**
 * Inline Code component for inline code snippets
 */
export interface InlineCodeProps extends BaseComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent';
}

const InlineCode = forwardRef<HTMLElement, InlineCodeProps>(
  (
    {
      className,
      children,
      variant = 'default',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'bg-surface-glass text-text-secondary',
      accent: 'bg-brand-primary/10 text-brand-primary',
    };

    return (
      <code
        ref={ref}
        className={cn(
          'px-1.5 py-0.5 rounded text-sm font-mono border border-border',
          variantClasses[variant],
          className
        )}
        data-testid={testId}
        {...props}
      >
        {children}
      </code>
    );
  }
);

InlineCode.displayName = 'InlineCode';

/**
 * Link component with consistent styling
 */
export interface LinkProps extends BaseComponentProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'muted';
  external?: boolean;
  underline?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      className,
      href,
      children,
      variant = 'default',
      external = false,
      underline = false,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'text-text-primary hover:text-brand-primary',
      brand: 'text-brand-primary hover:text-success-light',
      muted: 'text-text-muted hover:text-text-secondary',
    };

    return (
      <a
        ref={ref}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={cn(
          'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-background rounded',
          variantClasses[variant],
          {
            'underline': underline,
            'hover:underline': !underline,
          },
          className
        )}
        data-testid={testId}
        {...props}
      >
        {children}
        {external && (
          <svg
            className="inline-block ml-1 w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </a>
    );
  }
);

Link.displayName = 'Link';

/**
 * List component with consistent styling
 */
export interface ListProps extends BaseComponentProps {
  children: React.ReactNode;
  variant?: 'bullet' | 'numbered' | 'none';
  spacing?: 'tight' | 'normal' | 'relaxed';
}

const List = forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(
  (
    {
      className,
      children,
      variant = 'bullet',
      spacing = 'normal',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const Component = variant === 'numbered' ? 'ol' : 'ul';
    
    const spacingClasses = {
      tight: 'space-y-1',
      normal: 'space-y-2',
      relaxed: 'space-y-3',
    };

    const variantClasses = {
      bullet: 'list-disc list-inside',
      numbered: 'list-decimal list-inside',
      none: 'list-none',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          'text-text-secondary',
          variantClasses[variant],
          spacingClasses[spacing],
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

List.displayName = 'List';

// Export all typography components
export { Heading as default };
export { Text };
export { CodeBlock };
export { InlineCode };
export { Link };
export { List };