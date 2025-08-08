/**
 * Think Tank Technologies UI Component Library
 * Comprehensive, accessible, and typed component library for landing pages
 * Based on LANDING_PAGE_PLAN.md specifications
 */

// Core Components
export { default as Button, ButtonGroup, IconButton } from './Button';
export type { ButtonProps, ButtonGroupProps, IconButtonProps } from './Button';

export { default as Card, FeatureCard, PricingCard, StatCard } from './Card';
export type { CardProps, FeatureCardProps, PricingCardProps, StatCardProps } from './Card';

export { default as Input, Textarea, Select, Checkbox, RadioGroup, FormGroup } from './Input';
export type { 
  InputProps, 
  TextareaProps, 
  SelectProps, 
  CheckboxProps, 
  RadioGroupProps, 
  FormGroupProps,
  SelectOption,
  RadioOption 
} from './Input';

// Typography Components
export { 
  default as Heading, 
  Text, 
  CodeBlock, 
  InlineCode, 
  Link, 
  List 
} from './Typography';
export type { 
  TypographyProps,
  TextProps,
  CodeBlockProps,
  InlineCodeProps,
  LinkProps,
  ListProps 
} from './Typography';

// Layout Components
export { 
  default as Container, 
  Section, 
  Grid, 
  Flex, 
  Stack, 
  Spacer, 
  Center 
} from './Layout';
export type { 
  ContainerProps,
  SectionProps,
  GridProps,
  FlexProps,
  StackProps,
  SpacerProps,
  CenterProps 
} from './Layout';

// Navigation Components
export { 
  default as Navigation, 
  NavigationList, 
  Breadcrumb, 
  TabNav 
} from './Navigation';
export type { 
  NavigationProps,
  NavigationItem,
  BreadcrumbProps,
  BreadcrumbItem,
  TabNavProps 
} from './Navigation';

// Modal Components
export { 
  default as Modal, 
  Drawer, 
  Popover, 
  Tooltip 
} from './Modal';
export type { 
  ModalProps,
  DrawerProps,
  PopoverProps,
  TooltipProps 
} from './Modal';

// Loading Components
export { 
  default as Loading, 
  Spinner, 
  Skeleton, 
  Pulse, 
  Progress, 
  AnimationWrapper, 
  FadeTransition, 
  LoadingOverlay 
} from './Loading';
export type { 
  LoadingProps,
  SpinnerProps,
  SkeletonProps,
  PulseProps,
  ProgressProps,
  AnimationWrapperProps,
  FadeTransitionProps,
  LoadingOverlayProps 
} from './Loading';

// Type Exports
export type {
  BaseComponentProps,
  AnimationVariant,
  SizeVariant,
  ColorVariant,
} from '../../lib/types';

// Utility Exports
export { cn } from '../../lib/utils';

/**
 * Component Library Information
 */
export const TTT_UI_VERSION = '1.0.0';
export const TTT_UI_COMPONENTS = [
  'Button',
  'Card', 
  'Input',
  'Typography',
  'Layout',
  'Navigation',
  'Modal',
  'Loading'
] as const;

export const TTT_UI_INFO = {
  version: TTT_UI_VERSION,
  components: TTT_UI_COMPONENTS,
  description: 'Think Tank Technologies UI Component Library for Landing Pages',
  features: [
    'TypeScript support with comprehensive type definitions',
    'Accessibility-first design with WCAG AA compliance', 
    'Glassmorphism styling with dark theme support',
    'Responsive design with mobile-first approach',
    'Tree-shakable for optimal bundle size',
    'Consistent design tokens and spacing',
    'Animation support with reduced motion respect',
    'Focus management and keyboard navigation',
    'Server-side rendering compatible'
  ]
} as const;