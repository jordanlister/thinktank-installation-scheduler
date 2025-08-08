/**
 * Navigation Components
 * Accessible navigation components with responsive design
 * Based on Think Tank Technologies Landing Page Design System
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn, trapFocus, restoreFocus, generateId } from '../../lib/utils';
import { Button, IconButton } from './Button';
import type { NavigationProps, NavigationItem, BaseComponentProps } from '../../lib/types';

/**
 * Navigation Header component with responsive mobile menu
 * 
 * @example
 * ```tsx
 * const navigationItems = [
 *   { id: 'features', label: 'Features', href: '/features' },
 *   { id: 'pricing', label: 'Pricing', href: '/pricing' },
 *   { id: 'about', label: 'About', href: '/about' },
 * ];
 * 
 * <Navigation
 *   items={navigationItems}
 *   logo={{ src: '/logo.svg', alt: 'Company Logo', href: '/' }}
 *   actions={
 *     <>
 *       <Button variant="ghost">Login</Button>
 *       <Button variant="primary">Sign Up</Button>
 *     </>
 *   }
 * />
 * ```
 */
const Navigation = forwardRef<HTMLElement, NavigationProps>(
  (
    {
      className,
      items,
      orientation = 'horizontal',
      variant = 'primary',
      logo,
      actions,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    // Close mobile menu on escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          menuButtonRef.current?.focus();
        }
      };

      if (isMobileMenuOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isMobileMenuOpen]);

    // Trap focus in mobile menu
    useEffect(() => {
      let cleanup: (() => void) | undefined;

      if (isMobileMenuOpen && mobileMenuRef.current) {
        cleanup = trapFocus(mobileMenuRef.current);
      }

      return cleanup;
    }, [isMobileMenuOpen]);

    const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
      setIsMobileMenuOpen(false);
      restoreFocus(menuButtonRef.current);
    };

    const toggleDropdown = (itemId: string) => {
      setActiveDropdown(activeDropdown === itemId ? null : itemId);
    };

    return (
      <nav
        ref={ref}
        className={cn(
          'header-glass sticky top-0 z-50 w-full',
          className
        )}
        aria-label="Main navigation"
        data-testid={testId}
        {...props}
      >
        <div className="ttt-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            {logo && (
              <div className="flex-shrink-0">
                {logo.href ? (
                  <a
                    href={logo.href}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-brand-primary rounded"
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="h-8 w-auto"
                    />
                  </a>
                ) : (
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="h-8 w-auto"
                  />
                )}
              </div>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <NavigationList
                items={items}
                orientation="horizontal"
                variant={variant}
                activeDropdown={activeDropdown}
                onToggleDropdown={toggleDropdown}
              />
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {actions}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <IconButton
                ref={menuButtonRef}
                icon={
                  isMobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )
                }
                variant="ghost"
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <MobileMenu
            ref={mobileMenuRef}
            items={items}
            actions={actions}
            onClose={closeMobileMenu}
          />
        )}
      </nav>
    );
  }
);

Navigation.displayName = 'Navigation';

/**
 * Navigation List component for rendering navigation items
 */
interface NavigationListProps extends BaseComponentProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'primary' | 'secondary';
  activeDropdown?: string | null;
  onToggleDropdown?: (itemId: string) => void;
}

const NavigationList = forwardRef<HTMLUListElement, NavigationListProps>(
  (
    {
      className,
      items,
      orientation = 'horizontal',
      variant = 'primary',
      activeDropdown,
      onToggleDropdown,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const orientationClasses = {
      horizontal: 'flex space-x-8',
      vertical: 'flex flex-col space-y-2',
    };

    return (
      <ul
        ref={ref}
        className={cn(orientationClasses[orientation], className)}
        data-testid={testId}
        {...props}
      >
        {items.map((item) => (
          <NavigationListItem
            key={item.id}
            item={item}
            variant={variant}
            orientation={orientation}
            isDropdownOpen={activeDropdown === item.id}
            onToggleDropdown={() => onToggleDropdown?.(item.id)}
          />
        ))}
      </ul>
    );
  }
);

NavigationList.displayName = 'NavigationList';

/**
 * Individual Navigation List Item
 */
interface NavigationListItemProps {
  item: NavigationItem;
  variant: 'primary' | 'secondary';
  orientation: 'horizontal' | 'vertical';
  isDropdownOpen?: boolean;
  onToggleDropdown?: () => void;
}

const NavigationListItem = forwardRef<HTMLLIElement, NavigationListItemProps>(
  (
    {
      item,
      variant,
      orientation,
      isDropdownOpen = false,
      onToggleDropdown,
    },
    ref
  ) => {
    const hasChildren = item.children && item.children.length > 0;
    const dropdownId = generateId('dropdown');

    const linkClasses = cn(
      'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-brand-primary',
      {
        'text-white hover:text-brand-primary': variant === 'primary' && !item.active,
        'text-brand-primary': item.active,
        'text-text-secondary hover:text-text-primary': variant === 'secondary' && !item.active,
      }
    );

    if (hasChildren) {
      return (
        <li ref={ref} className="relative">
          <button
            className={cn(linkClasses, 'w-full justify-between')}
            onClick={onToggleDropdown}
            aria-expanded={isDropdownOpen}
            aria-controls={dropdownId}
            aria-haspopup="true"
          >
            <span className="flex items-center">
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </span>
            <svg
              className={cn('w-4 h-4 transition-transform', {
                'rotate-180': isDropdownOpen,
              })}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <ul
              id={dropdownId}
              className={cn(
                'absolute z-10 mt-2 py-2 rounded-lg shadow-lg',
                'bg-surface-glass backdrop-blur-xl border border-border',
                orientation === 'horizontal' ? 'left-0 w-48' : 'w-full'
              )}
            >
              {item.children!.map((childItem) => (
                <li key={childItem.id}>
                  <a
                    href={childItem.href}
                    className={cn(
                      'block px-4 py-2 text-sm text-text-secondary hover:text-text-primary',
                      'hover:bg-surface-elevated transition-colors duration-200',
                      'focus:outline-none focus:bg-surface-elevated'
                    )}
                  >
                    <span className="flex items-center">
                      {childItem.icon && <span className="mr-2">{childItem.icon}</span>}
                      {childItem.label}
                      {childItem.badge && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-brand-primary text-white rounded-full">
                          {childItem.badge}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li ref={ref}>
        <a href={item.href} className={linkClasses}>
          <span className="flex items-center">
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
            {item.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-brand-primary text-white rounded-full">
                {item.badge}
              </span>
            )}
          </span>
        </a>
      </li>
    );
  }
);

NavigationListItem.displayName = 'NavigationListItem';

/**
 * Mobile Navigation Menu
 */
interface MobileMenuProps extends BaseComponentProps {
  items: NavigationItem[];
  actions?: React.ReactNode;
  onClose: () => void;
}

const MobileMenu = forwardRef<HTMLDivElement, MobileMenuProps>(
  (
    {
      className,
      items,
      actions,
      onClose,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        id="mobile-menu"
        className={cn(
          'md:hidden',
          'bg-surface-glass backdrop-blur-xl border-t border-border',
          'animate-slide-down',
          className
        )}
        data-testid={testId}
        {...props}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <NavigationList
            items={items}
            orientation="vertical"
            variant="primary"
          />
        </div>

        {/* Mobile Actions */}
        {actions && (
          <div className="pt-4 pb-3 border-t border-border">
            <div className="px-2 space-y-2">
              {React.Children.map(actions, (action, index) => (
                <div key={index} className="w-full">
                  {React.isValidElement(action) && action.type === Button
                    ? React.cloneElement(action, { fullWidth: true })
                    : action}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MobileMenu.displayName = 'MobileMenu';

/**
 * Breadcrumb Navigation component
 */
export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      className,
      items,
      separator = (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    return (
      <nav
        ref={ref}
        className={cn('flex items-center space-x-2 text-sm', className)}
        aria-label="Breadcrumb"
        data-testid={testId}
        {...props}
      >
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center space-x-2">
              {item.href ? (
                <a
                  href={item.href}
                  className="text-text-muted hover:text-text-primary transition-colors duration-200"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-text-primary font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
              
              {index < items.length - 1 && (
                <span className="text-text-muted" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';

/**
 * Tab Navigation component
 */
export interface TabNavProps extends BaseComponentProps {
  items: Array<{
    id: string;
    label: string;
    href?: string;
    active?: boolean;
    disabled?: boolean;
  }>;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
}

const TabNav = forwardRef<HTMLDivElement, TabNavProps>(
  (
    {
      className,
      items,
      variant = 'default',
      size = 'md',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'text-sm px-3 py-2',
      md: 'text-base px-4 py-3',
      lg: 'text-lg px-5 py-4',
    };

    const getTabClasses = (item: TabNavProps['items'][0]) => {
      const baseClasses = cn(
        sizeClasses[size],
        'font-medium transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand-primary',
        {
          'cursor-not-allowed opacity-50': item.disabled,
        }
      );

      switch (variant) {
        case 'pills':
          return cn(
            baseClasses,
            'rounded-lg',
            item.active
              ? 'bg-brand-primary text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
          );
        case 'underline':
          return cn(
            baseClasses,
            'border-b-2',
            item.active
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-muted'
          );
        default:
          return cn(
            baseClasses,
            'border border-border rounded-lg',
            item.active
              ? 'bg-surface-elevated border-brand-primary text-text-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
          );
      }
    };

    return (
      <div
        ref={ref}
        className={cn('flex space-x-1', className)}
        role="tablist"
        data-testid={testId}
        {...props}
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={getTabClasses(item)}
            role="tab"
            aria-selected={item.active}
            aria-disabled={item.disabled}
            tabIndex={item.disabled ? -1 : 0}
          >
            {item.label}
          </a>
        ))}
      </div>
    );
  }
);

TabNav.displayName = 'TabNav';

export { Navigation as default, NavigationList, Breadcrumb, TabNav };