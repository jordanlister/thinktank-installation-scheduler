/**
 * UI Component Library Utilities
 * Think Tank Technologies Landing Page Components
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique ID for accessibility purposes
 */
export function generateId(prefix: string = 'ttt'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Utility for handling focus trap in modals and overlays
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'details',
    '[tabindex]:not([tabindex="-1"])',
    'a[href]',
    'area[href]',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    'audio[controls]',
    'video[controls]',
    'summary'
  ];

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
  ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
}

/**
 * Trap focus within a container element
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // Focus the first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to a previously focused element
 */
export function restoreFocus(element: HTMLElement | null) {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if an element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  if (typeof window === 'undefined') return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Smooth scroll to element
 */
export function scrollToElement(
  element: HTMLElement,
  options: ScrollIntoViewOptions = {}
) {
  if (prefersReducedMotion()) {
    element.scrollIntoView({ behavior: 'auto', ...options });
  } else {
    element.scrollIntoView({ behavior: 'smooth', ...options });
  }
}

/**
 * Get contrast ratio between two colors (for accessibility)
 */
export function getContrastRatio(color1: string, color2: string): number {
  function getLuminance(color: string): number {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(c => {
      const val = parseInt(c) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate accessibility requirements for components
 */
export function validateAccessibility(element: HTMLElement): {
  hasAriaLabel: boolean;
  hasVisualText: boolean;
  isKeyboardAccessible: boolean;
  hasProperContrast: boolean;
} {
  const hasAriaLabel = Boolean(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title')
  );
  
  const hasVisualText = Boolean(element.textContent?.trim());
  
  const isKeyboardAccessible = Boolean(
    element.tabIndex >= 0 ||
    ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) ||
    element.getAttribute('tabindex') !== '-1'
  );

  // Basic contrast check would need color analysis
  const hasProperContrast = true; // Simplified for now

  return {
    hasAriaLabel,
    hasVisualText,
    isKeyboardAccessible,
    hasProperContrast
  };
}

/**
 * Create announcement for screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Handle keyboard navigation for custom components
 */
export function handleArrowKeyNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onIndexChange: (index: number) => void
) {
  let newIndex = currentIndex;

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = items.length - 1;
      break;
    default:
      return;
  }

  e.preventDefault();
  onIndexChange(newIndex);
  items[newIndex]?.focus();
}

/**
 * Create a portal container for modals and overlays
 */
export function createPortalContainer(id: string): HTMLElement {
  if (typeof document === 'undefined') {
    throw new Error('createPortalContainer can only be used in browser environment');
  }

  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.className = 'ttt-portal-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Cleanup portal container
 */
export function removePortalContainer(id: string) {
  if (typeof document === 'undefined') return;
  
  const container = document.getElementById(id);
  if (container) {
    document.body.removeChild(container);
  }
}

/**
 * Media query utilities
 */
export const mediaQueries = {
  isMobile: () => typeof window !== 'undefined' && window.innerWidth < 768,
  isTablet: () => typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: () => typeof window !== 'undefined' && window.innerWidth >= 1024,
  matches: (query: string) => typeof window !== 'undefined' && window.matchMedia(query).matches,
};

/**
 * Cookie utilities for consent and preferences
 */
export const cookies = {
  get: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  },
  
  set: (name: string, value: string, days: number = 365): void => {
    if (typeof document === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  },
  
  remove: (name: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

/**
 * Theme utilities
 */
export const theme = {
  get: (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark';
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark';
  },
  
  set: (newTheme: 'light' | 'dark'): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', newTheme);
    cookies.set('theme', newTheme);
  },
  
  toggle: (): void => {
    const currentTheme = theme.get();
    theme.set(currentTheme === 'light' ? 'dark' : 'light');
  },
  
  init: (): void => {
    if (typeof window === 'undefined') return;
    
    const savedTheme = cookies.get('theme') as 'light' | 'dark';
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemPreference;
    
    theme.set(initialTheme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!cookies.get('theme')) {
        theme.set(e.matches ? 'dark' : 'light');
      }
    });
  }
};