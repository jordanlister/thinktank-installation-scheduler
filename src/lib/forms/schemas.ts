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