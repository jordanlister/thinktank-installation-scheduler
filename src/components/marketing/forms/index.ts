/**
 * Lead Route - Marketing Forms
 * Comprehensive form components for landing page lead capture and conversion
 */

// Form Components
export { ContactForm } from './ContactForm';
export { DemoRequestForm } from './DemoRequestForm';
export { NewsletterSignup } from './NewsletterSignup';
export { ROICalculatorForm } from './ROICalculatorForm';
export { EnterpriseContactForm } from './EnterpriseContactForm';
export { TrialSignupForm } from './TrialSignupForm';

// Legacy form (for compatibility)
export { SecureContactForm } from './SecureContactForm';

// Form schemas and utilities
export * from '../../../lib/forms/schemas';
export * from '../../../lib/forms/utils';

/**
 * Marketing Forms Collection
 * 
 * This collection includes all form components needed for Lead Route
 * marketing and landing pages, each optimized for specific conversion goals:
 * 
 * 1. ContactForm - General inquiries and lead capture
 * 2. DemoRequestForm - Qualified lead capture with multi-step progressive disclosure
 * 3. NewsletterSignup - Email list building with minimal friction
 * 4. ROICalculatorForm - Interactive calculator with lead qualification
 * 5. EnterpriseContactForm - High-value B2B lead qualification
 * 6. TrialSignupForm - Account creation workflow with progressive profiling
 * 
 * All forms feature:
 * - React Hook Form + Zod validation
 * - Comprehensive security integration (anti-spam, rate limiting)
 * - Accessibility compliance (WCAG AA)
 * - Analytics tracking (no PII)
 * - Auto-save functionality for long forms
 * - Mobile-responsive design
 * - Progressive enhancement
 * - Conversion optimization
 */

export const MARKETING_FORM_TYPES = {
  CONTACT: 'contact',
  DEMO: 'demo', 
  NEWSLETTER: 'newsletter',
  ROI_CALCULATOR: 'roi',
  ENTERPRISE: 'enterprise',
  TRIAL: 'trial'
} as const;

export type MarketingFormType = typeof MARKETING_FORM_TYPES[keyof typeof MARKETING_FORM_TYPES];