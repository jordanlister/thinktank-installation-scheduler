/**
 * Think Tank Technologies Design Token Constants
 * TypeScript constants for programmatic access to design tokens
 * Enables theme switching and dynamic styling
 */

/* =============================================================================
 * COLOR TOKENS
 * ============================================================================= */

export const colors = {
  // Base Colors
  background: 'var(--background)',
  surface: {
    DEFAULT: 'var(--surface)',
    elevated: 'var(--surface-elevated)',
    glass: 'var(--surface-glass)',
    overlay: 'var(--surface-overlay)',
  },

  // Brand Colors - Think Tank Technologies
  brand: {
    primary: 'var(--brand-primary)',
    secondary: 'var(--brand-secondary)',
    accent: 'var(--brand-accent)',
  },

  // Semantic Colors
  success: {
    DEFAULT: 'var(--success)',
    light: 'var(--success-light)',
    dark: 'var(--success-dark)',
  },
  warning: {
    DEFAULT: 'var(--warning)',
    light: 'var(--warning-light)',
    dark: 'var(--warning-dark)',
  },
  error: {
    DEFAULT: 'var(--error)',
    light: 'var(--error-light)',
    dark: 'var(--error-dark)',
  },
  info: {
    DEFAULT: 'var(--info)',
    light: 'var(--info-light)',
    dark: 'var(--info-dark)',
  },

  // Text Colors
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    disabled: 'var(--text-disabled)',
  },

  // Border Colors
  border: {
    DEFAULT: 'var(--border)',
    light: 'var(--border-light)',
    focus: 'var(--border-focus)',
    error: 'var(--border-error)',
  },
} as const;

/* =============================================================================
 * GRADIENTS
 * ============================================================================= */

export const gradients = {
  hero: 'var(--gradient-hero)',
  accent: 'var(--gradient-accent)',
  glass: 'var(--gradient-glass)',
  surface: 'var(--gradient-surface)',
  primary: 'var(--gradient-primary)',
  secondary: 'var(--gradient-secondary)',
  danger: 'var(--gradient-danger)',
} as const;

/* =============================================================================
 * TYPOGRAPHY TOKENS
 * ============================================================================= */

export const fonts = {
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
} as const;

export const fontSize = {
  xs: 'var(--text-xs)',
  sm: 'var(--text-sm)',
  base: 'var(--text-base)',
  lg: 'var(--text-lg)',
  xl: 'var(--text-xl)',
  '2xl': 'var(--text-2xl)',
  '3xl': 'var(--text-3xl)',
  '4xl': 'var(--text-4xl)',
  '5xl': 'var(--text-5xl)',
  '6xl': 'var(--text-6xl)',
  '7xl': 'var(--text-7xl)',
} as const;

export const fontWeight = {
  light: 'var(--font-light)',
  normal: 'var(--font-normal)',
  medium: 'var(--font-medium)',
  semibold: 'var(--font-semibold)',
  bold: 'var(--font-bold)',
  extrabold: 'var(--font-extrabold)',
  black: 'var(--font-black)',
} as const;

export const lineHeight = {
  tight: 'var(--leading-tight)',
  snug: 'var(--leading-snug)',
  normal: 'var(--leading-normal)',
  relaxed: 'var(--leading-relaxed)',
  loose: 'var(--leading-loose)',
} as const;

/* =============================================================================
 * SPACING TOKENS
 * ============================================================================= */

export const spacing = {
  px: 'var(--space-px)',
  0: 'var(--space-0)',
  0.5: 'var(--space-0-5)',
  1: 'var(--space-1)',
  1.5: 'var(--space-1-5)',
  2: 'var(--space-2)',
  2.5: 'var(--space-2-5)',
  3: 'var(--space-3)',
  3.5: 'var(--space-3-5)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  7: 'var(--space-7)',
  8: 'var(--space-8)',
  9: 'var(--space-9)',
  10: 'var(--space-10)',
  11: 'var(--space-11)',
  12: 'var(--space-12)',
  14: 'var(--space-14)',
  16: 'var(--space-16)',
  20: 'var(--space-20)',
  24: 'var(--space-24)',
  28: 'var(--space-28)',
  32: 'var(--space-32)',
  36: 'var(--space-36)',
  40: 'var(--space-40)',
  44: 'var(--space-44)',
  48: 'var(--space-48)',
  52: 'var(--space-52)',
  56: 'var(--space-56)',
  60: 'var(--space-60)',
  64: 'var(--space-64)',
  72: 'var(--space-72)',
  80: 'var(--space-80)',
  96: 'var(--space-96)',
} as const;

/* =============================================================================
 * BORDER RADIUS TOKENS
 * ============================================================================= */

export const borderRadius = {
  none: 'var(--radius-none)',
  sm: 'var(--radius-sm)',
  DEFAULT: 'var(--radius)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  '3xl': 'var(--radius-3xl)',
  full: 'var(--radius-full)',
} as const;

/* =============================================================================
 * SHADOW TOKENS
 * ============================================================================= */

export const shadows = {
  sm: 'var(--shadow-sm)',
  DEFAULT: 'var(--shadow)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',

  // Glass shadows
  glass: 'var(--shadow-glass)',
  glassLg: 'var(--shadow-glass-lg)',
  glassXl: 'var(--shadow-glass-xl)',

  // Glow effects
  glowSm: 'var(--shadow-glow-sm)',
  glow: 'var(--shadow-glow)',
  glowLg: 'var(--shadow-glow-lg)',
  glowXl: 'var(--shadow-glow-xl)',

  // Focus shadows
  focus: 'var(--shadow-focus)',
  focusError: 'var(--shadow-focus-error)',
} as const;

/* =============================================================================
 * BACKDROP BLUR TOKENS
 * ============================================================================= */

export const backdropBlur = {
  none: 'var(--blur-none)',
  sm: 'var(--blur-sm)',
  DEFAULT: 'var(--blur)',
  md: 'var(--blur-md)',
  lg: 'var(--blur-lg)',
  xl: 'var(--blur-xl)',
  '2xl': 'var(--blur-2xl)',
  '3xl': 'var(--blur-3xl)',
} as const;

/* =============================================================================
 * Z-INDEX TOKENS
 * ============================================================================= */

export const zIndex = {
  auto: 'var(--z-auto)',
  0: 'var(--z-0)',
  10: 'var(--z-10)',
  20: 'var(--z-20)',
  30: 'var(--z-30)',
  40: 'var(--z-40)',
  50: 'var(--z-50)',
  dropdown: 'var(--z-dropdown)',
  sticky: 'var(--z-sticky)',
  fixed: 'var(--z-fixed)',
  modalBackdrop: 'var(--z-modal-backdrop)',
  modal: 'var(--z-modal)',
  popover: 'var(--z-popover)',
  tooltip: 'var(--z-tooltip)',
  toast: 'var(--z-toast)',
} as const;

/* =============================================================================
 * ANIMATION & MOTION TOKENS
 * ============================================================================= */

export const duration = {
  75: 'var(--duration-75)',
  100: 'var(--duration-100)',
  150: 'var(--duration-150)',
  200: 'var(--duration-200)',
  300: 'var(--duration-300)',
  500: 'var(--duration-500)',
  700: 'var(--duration-700)',
  1000: 'var(--duration-1000)',
} as const;

export const easing = {
  linear: 'var(--ease-linear)',
  in: 'var(--ease-in)',
  out: 'var(--ease-out)',
  inOut: 'var(--ease-in-out)',
  back: 'var(--ease-back)',
} as const;

/* =============================================================================
 * COMPONENT VARIANTS
 * ============================================================================= */

export const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning',
} as const;

export const buttonSizes = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  DEFAULT: 'btn',
  lg: 'btn-lg',
  xl: 'btn-xl',
} as const;

export const cardVariants = {
  DEFAULT: 'card',
  feature: 'card-feature',
  glass: 'card-glass',
  stat: 'card-stat',
} as const;

export const badgeVariants = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  primary: 'badge-primary',
} as const;

export const alertVariants = {
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
  info: 'alert-info',
} as const;

/* =============================================================================
 * THEME UTILITIES
 * ============================================================================= */

/**
 * Theme switching utility
 */
export const setTheme = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
  }
};

/**
 * Get current theme
 */
export const getTheme = (): 'light' | 'dark' => {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  return 'dark'; // Default to dark
};

/**
 * Toggle theme
 */
export const toggleTheme = () => {
  const currentTheme = getTheme();
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true; // Default to dark
};

/**
 * Initialize theme based on user preference
 */
export const initializeTheme = () => {
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    // Check for stored theme preference
    const storedTheme = localStorage.getItem('ttt-theme') as 'light' | 'dark' | null;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (prefersDarkMode()) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    
    // Store theme preference
    const currentTheme = getTheme();
    localStorage.setItem('ttt-theme', currentTheme);
  }
};

/* =============================================================================
 * TYPE DEFINITIONS
 * ============================================================================= */

export type ThemeMode = 'light' | 'dark';

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
export type ShadowToken = keyof typeof shadows;
export type BorderRadiusToken = keyof typeof borderRadius;
export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;
export type CardVariant = keyof typeof cardVariants;
export type BadgeVariant = keyof typeof badgeVariants;
export type AlertVariant = keyof typeof alertVariants;

/* =============================================================================
 * DEFAULT EXPORT
 * ============================================================================= */

const theme = {
  colors,
  gradients,
  fonts,
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  borderRadius,
  shadows,
  backdropBlur,
  zIndex,
  duration,
  easing,
  buttonVariants,
  buttonSizes,
  cardVariants,
  badgeVariants,
  alertVariants,
  setTheme,
  getTheme,
  toggleTheme,
  prefersReducedMotion,
  prefersDarkMode,
  initializeTheme,
} as const;

export default theme;