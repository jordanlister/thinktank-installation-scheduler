/**
 * Think Tank Technologies - Marketing Form Validation Schemas
 * Comprehensive Zod schemas for all marketing forms with TypeScript types
 */

import { z } from 'zod';

// Common validation patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long');

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters');

const phoneSchema = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) return true;
    // Remove all non-digit characters for validation
    const cleaned = value.replace(/[\s\-\(\)\+\.]/g, '');
    return /^\d{10,15}$/.test(cleaned);
  }, 'Please enter a valid phone number');

const companyNameSchema = z
  .string()
  .min(2, 'Company name must be at least 2 characters')
  .max(100, 'Company name is too long')
  .regex(/^[a-zA-Z0-9\s\-'.&,()]+$/, 'Company name contains invalid characters');

const messageSchema = z
  .string()
  .min(10, 'Message must be at least 10 characters')
  .max(5000, 'Message is too long');

const websiteSchema = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, 'Please enter a valid website URL');

// Industry options
export const INDUSTRY_OPTIONS = [
  { value: 'hvac', label: 'HVAC Installation & Service' },
  { value: 'solar', label: 'Solar Panel Installation' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'security', label: 'Security Systems' },
  { value: 'appliance', label: 'Appliance Installation' },
  { value: 'electrical', label: 'Electrical Services' },
  { value: 'plumbing', label: 'Plumbing Services' },
  { value: 'roofing', label: 'Roofing & Exterior' },
  { value: 'internet', label: 'Internet & Cable' },
  { value: 'other', label: 'Other' }
] as const;

// Team size options
export const TEAM_SIZE_OPTIONS = [
  { value: '1-3', label: '1-3 technicians' },
  { value: '4-10', label: '4-10 technicians' },
  { value: '11-25', label: '11-25 technicians' },
  { value: '26-50', label: '26-50 technicians' },
  { value: '51-100', label: '51-100 technicians' },
  { value: '100+', label: '100+ technicians' }
] as const;

// Revenue options
export const REVENUE_OPTIONS = [
  { value: 'under-1m', label: 'Under $1M' },
  { value: '1m-5m', label: '$1M - $5M' },
  { value: '5m-10m', label: '$5M - $10M' },
  { value: '10m-25m', label: '$10M - $25M' },
  { value: '25m-50m', label: '$25M - $50M' },
  { value: '50m+', label: '$50M+' }
] as const;

// Honeypot field for spam detection
const honeypotSchema = z.string().max(0, 'Spam detected');

/**
 * Contact Form Schema
 * Basic contact form for general inquiries
 */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  company: companyNameSchema.optional(),
  phone: phoneSchema,
  message: messageSchema,
  consent: z
    .boolean()
    .refine((val) => val === true, 'You must agree to our privacy policy'),
  // Honeypot field (should remain empty)
  _website: honeypotSchema.optional()
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Demo Request Form Schema
 * Enhanced form for qualified lead capture with company information
 */
export const demoFormSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: companyNameSchema,
  jobTitle: z
    .string()
    .min(2, 'Job title is required')
    .max(100, 'Job title is too long'),
  industry: z.enum(INDUSTRY_OPTIONS.map(opt => opt.value) as [string, ...string[]]),
  teamSize: z.enum(TEAM_SIZE_OPTIONS.map(opt => opt.value) as [string, ...string[]]),
  currentSolution: z
    .string()
    .optional()
    .refine((value) => !value || value.length <= 500, 'Description is too long'),
  challenges: z
    .array(z.string())
    .min(1, 'Please select at least one challenge'),
  timeline: z.enum(['immediate', 'within-month', 'within-quarter', 'exploring']),
  budget: z.enum(['under-10k', '10k-25k', '25k-50k', '50k-100k', '100k+']).optional(),
  website: websiteSchema,
  consent: z
    .boolean()
    .refine((val) => val === true, 'You must agree to our privacy policy'),
  marketing: z.boolean().default(false),
  _website: honeypotSchema.optional()
});

export type DemoFormData = z.infer<typeof demoFormSchema>;

/**
 * Newsletter Signup Schema
 * Simple email capture for maximum conversion
 */
export const newsletterSchema = z.object({
  email: emailSchema,
  firstName: z
    .string()
    .min(2, 'First name is required')
    .max(50, 'Name is too long')
    .optional(),
  interests: z
    .array(z.string())
    .optional(),
  consent: z
    .boolean()
    .refine((val) => val === true, 'You must agree to receive our newsletter'),
  _website: honeypotSchema.optional()
});

export type NewsletterData = z.infer<typeof newsletterSchema>;

/**
 * ROI Calculator Form Schema
 * Interactive calculator with company metrics
 */
export const roiCalculatorSchema = z.object({
  // Company Information
  companyName: companyNameSchema.optional(),
  industry: z.enum(INDUSTRY_OPTIONS.map(opt => opt.value) as [string, ...string[]]),
  
  // Current Operations
  monthlyInstallations: z
    .number()
    .min(1, 'Must be at least 1 installation per month')
    .max(10000, 'Please enter a realistic number'),
  averageTechnicians: z
    .number()
    .min(1, 'Must have at least 1 technician')
    .max(1000, 'Please enter a realistic number'),
  averageTravelTime: z
    .number()
    .min(5, 'Travel time must be at least 5 minutes')
    .max(480, 'Travel time seems unrealistic (max 8 hours)'),
  fuelCostPerGallon: z
    .number()
    .min(2, 'Fuel cost must be at least $2/gallon')
    .max(10, 'Fuel cost seems high (max $10/gallon)'),
  averageWagePerHour: z
    .number()
    .min(15, 'Wage must be at least $15/hour')
    .max(200, 'Wage seems high (max $200/hour)'),
  
  // Optional Contact Information
  email: emailSchema.optional(),
  phone: phoneSchema,
  
  consent: z.boolean().default(false),
  _website: honeypotSchema.optional()
});

export type ROICalculatorData = z.infer<typeof roiCalculatorSchema>;

/**
 * Enterprise Contact Form Schema
 * High-value lead qualification with detailed requirements
 */
export const enterpriseFormSchema = z.object({
  // Contact Information
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  
  // Company Information
  company: companyNameSchema,
  jobTitle: z
    .string()
    .min(2, 'Job title is required')
    .max(100, 'Job title is too long'),
  website: websiteSchema,
  
  // Business Details
  industry: z.enum(INDUSTRY_OPTIONS.map(opt => opt.value) as [string, ...string[]]),
  teamSize: z.enum(TEAM_SIZE_OPTIONS.map(opt => opt.value) as [string, ...string[]]),
  annualRevenue: z.enum(REVENUE_OPTIONS.map(opt => opt.value) as [string, ...string[]]),
  
  // Requirements
  currentSoftware: z
    .string()
    .max(500, 'Description is too long')
    .optional(),
  specificRequirements: z
    .string()
    .max(1000, 'Requirements description is too long')
    .optional(),
  integrationNeeds: z
    .array(z.string())
    .optional(),
  deploymentTimeline: z.enum([
    'asap',
    'within-month', 
    'within-quarter',
    'within-year',
    'exploring'
  ]),
  
  // Decision Making
  decisionMaker: z.enum(['yes', 'influence', 'no']),
  evaluationCriteria: z
    .array(z.string())
    .min(1, 'Please select evaluation criteria'),
  budget: z.enum([
    'under-50k',
    '50k-100k', 
    '100k-250k',
    '250k-500k',
    '500k+'
  ]).optional(),
  
  // Additional Information
  additionalNotes: z
    .string()
    .max(2000, 'Notes are too long')
    .optional(),
  
  consent: z
    .boolean()
    .refine((val) => val === true, 'You must agree to our privacy policy'),
  marketing: z.boolean().default(false),
  _website: honeypotSchema.optional()
});

export type EnterpriseFormData = z.infer<typeof enterpriseFormSchema>;

/**
 * Free Trial Signup Schema
 * Account creation workflow with minimal friction
 */
export const trialSignupSchema = z.object({
  // Account Information
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  
  // Company Information
  company: companyNameSchema,
  phone: phoneSchema,
  industry: z.enum(INDUSTRY_OPTIONS.map(opt => opt.value) as [string, ...string[]]),
  teamSize: z.enum(TEAM_SIZE_OPTIONS.map(opt => opt.value) as [string, ...string[]]),
  
  // Usage Information
  monthlyInstallations: z
    .number()
    .min(1, 'Must be at least 1 installation per month')
    .max(10000, 'Please enter a realistic number')
    .optional(),
  
  // Agreements
  terms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the Terms of Service'),
  privacy: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the Privacy Policy'),
  marketing: z.boolean().default(false),
  
  _website: honeypotSchema.optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type TrialSignupData = z.infer<typeof trialSignupSchema>;

/**
 * Challenge options for demo and enterprise forms
 */
export const CHALLENGE_OPTIONS = [
  { value: 'scheduling-conflicts', label: 'Scheduling conflicts and overlapping appointments' },
  { value: 'route-optimization', label: 'Inefficient routes and high travel costs' },
  { value: 'technician-utilization', label: 'Poor technician utilization and capacity' },
  { value: 'customer-communication', label: 'Customer communication and notifications' },
  { value: 'data-management', label: 'Manual data entry and management' },
  { value: 'reporting-analytics', label: 'Lack of reporting and analytics' },
  { value: 'inventory-tracking', label: 'Inventory and equipment tracking' },
  { value: 'compliance-documentation', label: 'Compliance and documentation requirements' }
] as const;

/**
 * Integration options for enterprise forms
 */
export const INTEGRATION_OPTIONS = [
  { value: 'crm-salesforce', label: 'Salesforce CRM' },
  { value: 'crm-hubspot', label: 'HubSpot CRM' },
  { value: 'erp-sap', label: 'SAP ERP' },
  { value: 'erp-oracle', label: 'Oracle ERP' },
  { value: 'accounting-quickbooks', label: 'QuickBooks' },
  { value: 'accounting-sage', label: 'Sage' },
  { value: 'communication-slack', label: 'Slack' },
  { value: 'communication-teams', label: 'Microsoft Teams' },
  { value: 'inventory-system', label: 'Inventory Management System' },
  { value: 'payment-processor', label: 'Payment Processor' },
  { value: 'custom-api', label: 'Custom API Integration' }
] as const;

/**
 * Evaluation criteria options
 */
export const EVALUATION_CRITERIA = [
  { value: 'ease-of-use', label: 'Ease of use and user experience' },
  { value: 'integration-capabilities', label: 'Integration capabilities' },
  { value: 'scalability', label: 'Scalability and growth potential' },
  { value: 'cost-effectiveness', label: 'Cost effectiveness and ROI' },
  { value: 'customer-support', label: 'Customer support and training' },
  { value: 'security-compliance', label: 'Security and compliance features' },
  { value: 'reporting-analytics', label: 'Reporting and analytics capabilities' },
  { value: 'mobile-accessibility', label: 'Mobile accessibility' },
  { value: 'customization', label: 'Customization options' }
] as const;

/**
 * Newsletter interest options
 */
export const NEWSLETTER_INTERESTS = [
  { value: 'industry-news', label: 'Industry news and trends' },
  { value: 'product-updates', label: 'Product updates and new features' },
  { value: 'best-practices', label: 'Best practices and tips' },
  { value: 'case-studies', label: 'Customer success stories' },
  { value: 'webinars-events', label: 'Webinars and events' },
  { value: 'research-reports', label: 'Research reports and insights' }
] as const;

/**
 * Form validation utilities
 */
export const validateFormWithSchema = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// =====================================================
// BILLING AND SUBSCRIPTION FORM SCHEMAS
// =====================================================

/**
 * Billing Address Schema
 * Standard address validation for billing information
 */
export const billingAddressSchema = z.object({
  line1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(100, 'Address line 1 is too long'),
  line2: z
    .string()
    .max(100, 'Address line 2 is too long')
    .optional(),
  city: z
    .string()
    .min(1, 'City is required')
    .max(50, 'City name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'City contains invalid characters'),
  state: z
    .string()
    .min(1, 'State/Province is required')
    .max(50, 'State/Province is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'State/Province contains invalid characters'),
  postalCode: z
    .string()
    .min(1, 'Postal/ZIP code is required')
    .max(20, 'Postal/ZIP code is too long')
    .regex(/^[a-zA-Z0-9\s\-]+$/, 'Postal/ZIP code contains invalid characters'),
  country: z
    .string()
    .min(2, 'Country is required')
    .max(2, 'Country code must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Country must be a valid 2-letter code (e.g., US, CA)')
    .default('US')
});

export type BillingAddressData = z.infer<typeof billingAddressSchema>;

/**
 * Tax ID Schema
 * Validation for business tax identification numbers
 */
export const taxIdSchema = z.object({
  type: z.enum([
    'us_ein',
    'ca_bn', 
    'gb_vat',
    'au_abn',
    'eu_vat',
    'generic'
  ], {
    errorMap: () => ({ message: 'Please select a valid tax ID type' })
  }),
  value: z
    .string()
    .min(1, 'Tax ID value is required')
    .max(50, 'Tax ID value is too long')
    .regex(/^[a-zA-Z0-9\-]+$/, 'Tax ID contains invalid characters')
});

export type TaxIdData = z.infer<typeof taxIdSchema>;

/**
 * Subscription Plan Selection Schema
 * Validation for plan selection and billing cycle
 */
export const subscriptionPlanSchema = z.object({
  planId: z.enum(['free', 'professional', 'enterprise'], {
    errorMap: () => ({ message: 'Please select a valid subscription plan' })
  }),
  billingCycle: z.enum(['monthly', 'yearly'], {
    errorMap: () => ({ message: 'Please select monthly or yearly billing' })
  }).default('monthly')
});

export type SubscriptionPlanData = z.infer<typeof subscriptionPlanSchema>;

/**
 * Subscription Signup Form Schema
 * Complete subscription signup with billing details
 */
export const subscriptionSignupSchema = z.object({
  // Plan Selection
  planId: z.enum(['professional', 'enterprise'], {
    errorMap: () => ({ message: 'Please select a subscription plan' })
  }),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  
  // Billing Contact Information
  billingDetails: z.object({
    name: z
      .string()
      .min(1, 'Billing name is required')
      .max(100, 'Name is too long')
      .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
    email: emailSchema,
    address: billingAddressSchema
  }),
  
  // Payment Method (will be handled by Stripe Elements)
  paymentMethodId: z
    .string()
    .optional(),
  
  // Tax Information (optional)
  taxId: taxIdSchema.optional(),
  
  // Promotional Code
  couponCode: z
    .string()
    .max(50, 'Coupon code is too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Coupon code contains invalid characters')
    .optional(),
  
  // Legal Agreements
  terms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the Terms of Service'),
  privacy: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the Privacy Policy'),
  
  // Marketing Consent
  marketing: z.boolean().default(false),
  
  // Honeypot
  _website: honeypotSchema.optional()
});

export type SubscriptionSignupData = z.infer<typeof subscriptionSignupSchema>;

/**
 * Payment Method Form Schema
 * For adding/updating payment methods
 */
export const paymentMethodSchema = z.object({
  // Payment Method Type
  type: z.enum(['card'], {
    errorMap: () => ({ message: 'Only card payments are supported currently' })
  }).default('card'),
  
  // Billing Details
  billingDetails: z.object({
    name: z
      .string()
      .min(1, 'Cardholder name is required')
      .max(100, 'Name is too long')
      .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
    email: emailSchema,
    address: billingAddressSchema
  }),
  
  // Set as Default
  setAsDefault: z.boolean().default(false),
  
  // Stripe Elements Integration (card details handled by Stripe)
  stripeElementsReady: z.boolean().default(false)
});

export type PaymentMethodData = z.infer<typeof paymentMethodSchema>;

/**
 * Billing Details Update Schema
 * For updating customer billing information
 */
export const billingDetailsUpdateSchema = z.object({
  // Contact Information
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  email: emailSchema,
  
  // Billing Address
  address: billingAddressSchema,
  
  // Tax IDs (multiple allowed for international businesses)
  taxIds: z
    .array(taxIdSchema)
    .max(5, 'Maximum 5 tax IDs allowed')
    .optional()
    .default([])
});

export type BillingDetailsUpdateData = z.infer<typeof billingDetailsUpdateSchema>;

/**
 * Subscription Update Schema
 * For plan changes and subscription modifications
 */
export const subscriptionUpdateSchema = z.object({
  // Plan Change
  newPlanId: z.enum(['free', 'professional', 'enterprise']).optional(),
  newBillingCycle: z.enum(['monthly', 'yearly']).optional(),
  
  // Payment Method Change
  paymentMethodId: z.string().optional(),
  
  // Proration Settings
  prorationBehavior: z.enum([
    'create_prorations',
    'none',
    'always_invoice'
  ]).default('create_prorations'),
  
  // Effective Date
  effectiveDate: z.enum(['immediately', 'next_period']).default('immediately'),
  
  // Change Reason (for analytics)
  changeReason: z
    .string()
    .max(500, 'Reason is too long')
    .optional()
});

export type SubscriptionUpdateData = z.infer<typeof subscriptionUpdateSchema>;

/**
 * Subscription Cancellation Schema
 * For handling subscription cancellations
 */
export const subscriptionCancellationSchema = z.object({
  // Cancellation Timing
  cancelAtPeriodEnd: z.boolean().default(true),
  
  // Cancellation Reason (for feedback)
  reason: z.enum([
    'too_expensive',
    'missing_features', 
    'poor_support',
    'technical_issues',
    'switching_provider',
    'no_longer_needed',
    'other'
  ]).optional(),
  
  // Detailed Feedback
  feedback: z
    .string()
    .max(1000, 'Feedback is too long')
    .optional(),
  
  // Exit Survey
  wouldRecommend: z.boolean().optional(),
  overallSatisfaction: z
    .number()
    .min(1)
    .max(5)
    .optional(),
  
  // Re-engagement Offers
  acceptOffers: z.boolean().default(false)
});

export type SubscriptionCancellationData = z.infer<typeof subscriptionCancellationSchema>;

/**
 * Invoice Download Request Schema
 * For requesting invoice downloads
 */
export const invoiceRequestSchema = z.object({
  invoiceId: z
    .string()
    .min(1, 'Invoice ID is required'),
  format: z.enum(['pdf', 'json']).default('pdf')
});

export type InvoiceRequestData = z.infer<typeof invoiceRequestSchema>;

/**
 * Usage Alert Preferences Schema
 * For configuring usage limit notifications
 */
export const usageAlertPreferencesSchema = z.object({
  // Alert Thresholds
  projectsThreshold: z
    .number()
    .min(50)
    .max(100)
    .default(80),
  teamMembersThreshold: z
    .number()
    .min(50)
    .max(100)
    .default(80),
  installationsThreshold: z
    .number()
    .min(50)
    .max(100)
    .default(80),
  storageThreshold: z
    .number()
    .min(50)
    .max(100)
    .default(80),
  
  // Notification Methods
  emailNotifications: z.boolean().default(true),
  inAppNotifications: z.boolean().default(true),
  
  // Notification Recipients (additional emails)
  additionalRecipients: z
    .array(emailSchema)
    .max(10, 'Maximum 10 additional recipients')
    .optional()
    .default([])
});

export type UsageAlertPreferencesData = z.infer<typeof usageAlertPreferencesSchema>;

/**
 * Billing Portal Access Schema
 * For generating billing portal sessions
 */
export const billingPortalSchema = z.object({
  returnUrl: z
    .string()
    .url('Invalid return URL')
    .optional()
});

export type BillingPortalData = z.infer<typeof billingPortalSchema>;

/**
 * Coupon Application Schema
 * For applying promotional codes
 */
export const couponApplicationSchema = z.object({
  code: z
    .string()
    .min(1, 'Coupon code is required')
    .max(50, 'Coupon code is too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Coupon code contains invalid characters')
    .transform(val => val.toUpperCase())
});

export type CouponApplicationData = z.infer<typeof couponApplicationSchema>;

// Billing form validation options and constants
export const BILLING_COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'DK', label: 'Denmark' },
  { value: 'NO', label: 'Norway' }
] as const;

export const TAX_ID_TYPES = [
  { value: 'us_ein', label: 'US EIN (Employer Identification Number)' },
  { value: 'ca_bn', label: 'Canada Business Number' },
  { value: 'gb_vat', label: 'UK VAT Number' },
  { value: 'au_abn', label: 'Australia ABN' },
  { value: 'eu_vat', label: 'EU VAT Number' },
  { value: 'generic', label: 'Other Tax ID' }
] as const;

export const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'missing_features', label: 'Missing required features' },
  { value: 'poor_support', label: 'Unsatisfactory customer support' },
  { value: 'technical_issues', label: 'Technical problems or bugs' },
  { value: 'switching_provider', label: 'Switching to another provider' },
  { value: 'no_longer_needed', label: 'No longer need the service' },
  { value: 'other', label: 'Other reason' }
] as const;

export const PRORATION_BEHAVIORS = [
  { 
    value: 'create_prorations', 
    label: 'Prorate charges immediately',
    description: 'You will be charged/credited for the time used on each plan'
  },
  { 
    value: 'none', 
    label: 'No prorations',
    description: 'Changes will take effect at the next billing cycle'
  },
  { 
    value: 'always_invoice', 
    label: 'Always create invoice',
    description: 'Generate an invoice for any charges immediately'
  }
] as const;