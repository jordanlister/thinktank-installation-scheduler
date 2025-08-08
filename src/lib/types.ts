/**
 * TypeScript Types and Interfaces for TTT UI Component Library
 */

import { type ReactNode, type HTMLAttributes, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';

/**
 * Base component props that all components inherit
 */
export interface BaseComponentProps {
  /** Custom CSS class name */
  className?: string;
  /** React children */
  children?: ReactNode;
  /** Custom data attributes for testing */
  'data-testid'?: string;
}

/**
 * Animation variant types
 */
export type AnimationVariant = 'fade-in' | 'slide-up' | 'scale-in' | 'none';

/**
 * Size variants used across components
 */
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Color variants for status indicators
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Button component props
 */
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>, BaseComponentProps {
  /** Button visual variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  size?: SizeVariant;
  /** Show loading state */
  loading?: boolean;
  /** Icon to show before text */
  leftIcon?: ReactNode;
  /** Icon to show after text */
  rightIcon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** As child pattern for composition */
  asChild?: boolean;
}

/**
 * Card component props
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement>, BaseComponentProps {
  /** Card variant */
  variant?: 'glass' | 'feature' | 'pricing';
  /** Hover effects */
  hoverable?: boolean;
  /** Show as popular (for pricing cards) */
  popular?: boolean;
  /** Animation on mount */
  animation?: AnimationVariant;
}

/**
 * Input component props
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, BaseComponentProps {
  /** Input size */
  size?: Exclude<SizeVariant, 'xs'>;
  /** Show error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Input label */
  label?: string;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
  /** Required field indicator */
  required?: boolean;
}

/**
 * Typography component props
 */
export interface TypographyProps extends HTMLAttributes<HTMLElement>, BaseComponentProps {
  /** Text variant */
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'lead' | 'small' | 'code';
  /** Text color variant */
  color?: 'primary' | 'secondary' | 'muted' | 'brand' | 'success' | 'warning' | 'error';
  /** Element tag to render */
  as?: keyof JSX.IntrinsicElements;
  /** Truncate text */
  truncate?: boolean;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Container component props
 */
export interface ContainerProps extends HTMLAttributes<HTMLDivElement>, BaseComponentProps {
  /** Container max width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Center content */
  center?: boolean;
}

/**
 * Grid component props
 */
export interface GridProps extends HTMLAttributes<HTMLDivElement>, BaseComponentProps {
  /** Number of columns */
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Responsive column configuration */
  responsive?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap between items */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  /** Modal open state */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom overlay props */
  overlayProps?: HTMLAttributes<HTMLDivElement>;
  /** Initial focus element selector */
  initialFocus?: string;
  /** Return focus element selector */
  returnFocus?: string;
}

/**
 * Navigation item type
 */
export interface NavigationItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation URL */
  href: string;
  /** Is active */
  active?: boolean;
  /** Icon component */
  icon?: ReactNode;
  /** Badge content */
  badge?: string | number;
  /** Sub-navigation items */
  children?: NavigationItem[];
}

/**
 * Navigation component props
 */
export interface NavigationProps extends BaseComponentProps {
  /** Navigation items */
  items: NavigationItem[];
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Variant */
  variant?: 'primary' | 'secondary';
  /** Logo configuration */
  logo?: {
    src: string;
    alt: string;
    href?: string;
  };
  /** Additional actions */
  actions?: ReactNode;
}

/**
 * Loading component props
 */
export interface LoadingProps extends BaseComponentProps {
  /** Loading variant */
  variant?: 'spinner' | 'skeleton' | 'pulse';
  /** Size */
  size?: SizeVariant;
  /** Color */
  color?: ColorVariant;
  /** Loading text */
  text?: string;
  /** Overlay the entire container */
  overlay?: boolean;
}

/**
 * Toast notification type
 */
export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast title */
  title?: string;
  /** Toast message */
  message: string;
  /** Toast type */
  type: ColorVariant;
  /** Auto dismiss duration (ms) */
  duration?: number;
  /** Dismissible */
  dismissible?: boolean;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Form field validation state
 */
export interface FieldValidation {
  /** Is field valid */
  isValid: boolean;
  /** Validation message */
  message?: string;
  /** Validation type */
  type?: 'error' | 'warning' | 'success';
}

/**
 * Form component props
 */
export interface FormProps extends HTMLAttributes<HTMLFormElement>, BaseComponentProps {
  /** Submit handler */
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  /** Form validation */
  validation?: Record<string, FieldValidation>;
  /** Show form loading state */
  loading?: boolean;
  /** Form layout */
  layout?: 'vertical' | 'horizontal' | 'inline';
}

/**
 * Badge component props
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, BaseComponentProps {
  /** Badge variant */
  variant?: ColorVariant;
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Show dot indicator */
  dot?: boolean;
  /** Badge content */
  content?: string | number;
}

/**
 * Dropdown/Select option type
 */
export interface SelectOption {
  /** Option value */
  value: string | number;
  /** Option label */
  label: string;
  /** Is option disabled */
  disabled?: boolean;
  /** Option group */
  group?: string;
  /** Option icon */
  icon?: ReactNode;
}

/**
 * Dropdown/Select component props
 */
export interface SelectProps extends Omit<BaseComponentProps, 'children'> {
  /** Available options */
  options: SelectOption[];
  /** Selected value */
  value?: string | number;
  /** Change handler */
  onChange?: (value: string | number) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Multiple selection */
  multiple?: boolean;
  /** Searchable options */
  searchable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Size variant */
  size?: Exclude<SizeVariant, 'xs'>;
}

/**
 * Tab item type
 */
export interface TabItem {
  /** Unique identifier */
  id: string;
  /** Tab label */
  label: string;
  /** Tab content */
  content: ReactNode;
  /** Is tab disabled */
  disabled?: boolean;
  /** Tab icon */
  icon?: ReactNode;
  /** Badge content */
  badge?: string | number;
}

/**
 * Tabs component props
 */
export interface TabsProps extends BaseComponentProps {
  /** Tab items */
  items: TabItem[];
  /** Default active tab */
  defaultActiveTab?: string;
  /** Active tab change handler */
  onTabChange?: (tabId: string) => void;
  /** Tabs orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Tabs variant */
  variant?: 'default' | 'pills' | 'underline';
}

/**
 * Accordion item type
 */
export interface AccordionItem {
  /** Unique identifier */
  id: string;
  /** Accordion header */
  header: string | ReactNode;
  /** Accordion content */
  content: ReactNode;
  /** Is item disabled */
  disabled?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
}

/**
 * Accordion component props
 */
export interface AccordionProps extends BaseComponentProps {
  /** Accordion items */
  items: AccordionItem[];
  /** Allow multiple items open */
  multiple?: boolean;
  /** Collapsible (can close all) */
  collapsible?: boolean;
  /** Default open items */
  defaultOpenItems?: string[];
}

/**
 * Theme context type
 */
export interface ThemeContext {
  /** Current theme */
  theme: 'light' | 'dark';
  /** Toggle theme */
  toggleTheme: () => void;
  /** Set specific theme */
  setTheme: (theme: 'light' | 'dark') => void;
}

/**
 * Component with forwarded ref
 */
export type ComponentWithRef<T, P> = React.ForwardRefExoticComponent<
  P & React.RefAttributes<T>
>;

/**
 * Polymorphic component props
 */
export type PolymorphicComponentProps<
  T extends React.ElementType,
  P = {}
> = P & 
  Omit<React.ComponentPropsWithoutRef<T>, keyof P> & {
    as?: T;
  };

/**
 * Generic component props with element type
 */
export type ComponentProps<T extends React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;