/**
 * Think Tank Technologies - Form Utilities
 * Utilities for form submission, security integration, and response handling
 */

import { 
  validateFormData,
  checkRateLimit,
  checkSpam,
  logSecurityEvent
} from '../security';
import { 
  SecurityEventType, 
  SecuritySeverity,
  type FormSubmissionData 
} from '../security/types';
import { generateNonce, hashData } from '../security/encryption';

/**
 * Standard form response structure
 */
export interface FormResponse {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  data?: any;
}

/**
 * Form submission configuration
 */
export interface FormConfig {
  endpoint: string;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  enableSpamDetection?: boolean;
  enableHoneypot?: boolean;
  requiredFields?: string[];
}

/**
 * Default form configurations for different form types
 */
export const FORM_CONFIGS: Record<string, FormConfig> = {
  contact: {
    endpoint: '/api/forms/contact',
    rateLimit: { requests: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 minutes
    enableSpamDetection: true,
    enableHoneypot: true,
    requiredFields: ['name', 'email', 'message']
  },
  demo: {
    endpoint: '/api/forms/demo',
    rateLimit: { requests: 2, windowMs: 30 * 60 * 1000 }, // 2 per 30 minutes
    enableSpamDetection: true,
    enableHoneypot: true,
    requiredFields: ['firstName', 'lastName', 'email', 'company']
  },
  newsletter: {
    endpoint: '/api/forms/newsletter',
    rateLimit: { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    enableSpamDetection: true,
    enableHoneypot: true,
    requiredFields: ['email']
  },
  roi: {
    endpoint: '/api/forms/roi-calculator',
    rateLimit: { requests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    enableSpamDetection: false, // More lenient for calculators
    enableHoneypot: true,
    requiredFields: []
  },
  enterprise: {
    endpoint: '/api/forms/enterprise',
    rateLimit: { requests: 1, windowMs: 30 * 60 * 1000 }, // 1 per 30 minutes
    enableSpamDetection: true,
    enableHoneypot: true,
    requiredFields: ['firstName', 'lastName', 'email', 'company']
  },
  trial: {
    endpoint: '/api/forms/trial-signup',
    rateLimit: { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    enableSpamDetection: true,
    enableHoneypot: true,
    requiredFields: ['firstName', 'lastName', 'email', 'company', 'password']
  }
};

/**
 * Gets client information for security checks
 */
const getClientInfo = (): {
  ip: string;
  userAgent: string;
  fingerprint: Promise<string>;
  timestamp: number;
} => {
  const timestamp = Date.now();
  const userAgent = navigator.userAgent;
  
  // In a real application, IP would be obtained server-side
  const ip = 'client-ip';
  
  // Generate browser fingerprint
  const fingerprint = generateFingerprint();
  
  return { ip, userAgent, fingerprint, timestamp };
};

/**
 * Generates a device/browser fingerprint for security
 */
const generateFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.cookieEnabled.toString(),
    navigator.doNotTrack || 'unknown'
  ];

  const fingerprint = await hashData(components.join('|'));
  return fingerprint.substring(0, 16);
};

/**
 * Performs comprehensive security validation before form submission
 */
export const validateFormSecurity = async (
  formData: any,
  formType: string
): Promise<{ allowed: boolean; reason?: string; errors?: Record<string, string> }> => {
  const config = FORM_CONFIGS[formType];
  const clientInfo = getClientInfo();
  const fingerprint = await clientInfo.fingerprint;
  
  // Prepare form data with security metadata
  const submissionData: FormSubmissionData = {
    ...formData,
    _timestamp: clientInfo.timestamp,
    _userAgent: clientInfo.userAgent,
    _fingerprint: fingerprint,
    _referrer: document.referrer
  };

  // Check honeypot (if enabled)
  if (config.enableHoneypot && formData._website) {
    logSecurityEvent(
      SecurityEventType.SPAM_ATTEMPT,
      SecuritySeverity.HIGH,
      'Honeypot field filled',
      { formType, fingerprint },
      { ip: clientInfo.ip, userAgent: clientInfo.userAgent, endpoint: config.endpoint }
    );
    return { 
      allowed: false, 
      reason: 'Spam detected',
      errors: { _general: 'Your submission has been flagged by our security systems.' }
    };
  }

  // Validate input content
  const validation = validateFormData(submissionData);
  if (!validation.isValid) {
    logSecurityEvent(
      SecurityEventType.MALICIOUS_PAYLOAD,
      SecuritySeverity.HIGH,
      'Malicious content detected in form submission',
      { formType, threats: validation.threats, fingerprint },
      { ip: clientInfo.ip, userAgent: clientInfo.userAgent, endpoint: config.endpoint }
    );
    return { 
      allowed: false, 
      reason: 'Invalid content detected',
      errors: validation.errors
    };
  }

  // Check rate limiting
  const rateCheck = checkRateLimit(
    clientInfo.ip,
    config.endpoint,
    clientInfo.userAgent,
    config.rateLimit?.requests,
    config.rateLimit?.windowMs
  );
  
  if (!rateCheck.allowed) {
    logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecuritySeverity.MEDIUM,
      'Rate limit exceeded',
      { formType, fingerprint, rateLimit: rateCheck },
      { ip: clientInfo.ip, userAgent: clientInfo.userAgent, endpoint: config.endpoint }
    );
    return { 
      allowed: false, 
      reason: 'Rate limit exceeded',
      errors: { _general: 'Too many requests. Please wait before trying again.' }
    };
  }

  // Check for spam patterns (if enabled)
  if (config.enableSpamDetection) {
    const spamCheck = checkSpam(submissionData, clientInfo.ip, clientInfo.userAgent);
    if (!spamCheck.allowed) {
      logSecurityEvent(
        SecurityEventType.SPAM_ATTEMPT,
        SecuritySeverity.MEDIUM,
        'Spam patterns detected',
        { formType, spamCheck, fingerprint },
        { ip: clientInfo.ip, userAgent: clientInfo.userAgent, endpoint: config.endpoint }
      );
      return { 
        allowed: false, 
        reason: 'Spam detected',
        errors: { _general: 'Your submission has been flagged by our security systems.' }
      };
    }
  }

  return { allowed: true };
};

/**
 * Submits form data with comprehensive security and error handling
 */
export const submitForm = async <T>(
  formData: T,
  formType: string,
  options?: {
    onProgress?: (progress: number) => void;
    customEndpoint?: string;
    skipSecurity?: boolean;
  }
): Promise<FormResponse> => {
  const config = FORM_CONFIGS[formType];
  const endpoint = options?.customEndpoint || config.endpoint;
  
  try {
    // Report progress
    options?.onProgress?.(10);

    // Security validation (unless skipped)
    if (!options?.skipSecurity) {
      const securityCheck = await validateFormSecurity(formData, formType);
      if (!securityCheck.allowed) {
        return {
          ok: false,
          message: securityCheck.reason || 'Security validation failed',
          fieldErrors: securityCheck.errors
        };
      }
    }

    options?.onProgress?.(30);

    // Prepare submission data
    const clientInfo = getClientInfo();
    const fingerprint = await clientInfo.fingerprint;
    const nonce = generateNonce();
    
    const submissionPayload = {
      ...formData,
      _metadata: {
        timestamp: clientInfo.timestamp,
        fingerprint,
        nonce,
        formType,
        referrer: document.referrer
      }
    };

    options?.onProgress?.(50);

    // Submit to API (simulated for now since this is a client-side application)
    const response = await simulateFormSubmission(submissionPayload, endpoint);

    options?.onProgress?.(80);

    if (response.ok) {
      // Log successful submission
      logSecurityEvent(
        SecurityEventType.UNAUTHORIZED_ACCESS,
        SecuritySeverity.LOW,
        `${formType} form submitted successfully`,
        { formType, fingerprint },
        { ip: clientInfo.ip, userAgent: clientInfo.userAgent, endpoint }
      );

      options?.onProgress?.(100);

      return {
        ok: true,
        message: getSuccessMessage(formType),
        data: response.data
      };
    } else {
      return {
        ok: false,
        message: response.message || 'Submission failed',
        fieldErrors: response.fieldErrors
      };
    }

  } catch (error) {
    // Log submission error
    logSecurityEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecuritySeverity.MEDIUM,
      `${formType} form submission failed`,
      { formType, error: error instanceof Error ? error.message : 'Unknown error' },
      { endpoint }
    );

    return {
      ok: false,
      message: 'An error occurred while submitting the form. Please try again.',
      fieldErrors: { _general: 'Submission failed due to a technical error.' }
    };
  }
};

/**
 * Simulates form submission for development/demo purposes
 * In production, this would make actual API calls
 */
const simulateFormSubmission = async (
  data: any,
  endpoint: string
): Promise<{ ok: boolean; message?: string; fieldErrors?: Record<string, string>; data?: any }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Simulate occasional errors for testing
  if (Math.random() < 0.1) { // 10% chance of error
    return {
      ok: false,
      message: 'Service temporarily unavailable. Please try again.'
    };
  }

  // Simulate validation errors for specific test cases
  if (data.email?.includes('error@test.com')) {
    return {
      ok: false,
      message: 'Validation failed',
      fieldErrors: {
        email: 'This email address is already registered'
      }
    };
  }

  // Simulate successful submission
  return {
    ok: true,
    data: {
      id: generateNonce(),
      submittedAt: new Date().toISOString(),
      endpoint
    }
  };
};

/**
 * Gets success message based on form type
 */
const getSuccessMessage = (formType: string): string => {
  const messages: Record<string, string> = {
    contact: 'Thank you for your message! We\'ll get back to you within 24 hours.',
    demo: 'Demo request submitted successfully! Our team will contact you to schedule your personalized demo.',
    newsletter: 'Successfully subscribed to our newsletter! Check your email for confirmation.',
    roi: 'ROI calculation completed! Your results have been saved and emailed to you.',
    enterprise: 'Thank you for your interest! Our enterprise team will contact you within 24 hours.',
    trial: 'Your free trial account has been created! Check your email for login instructions.'
  };
  
  return messages[formType] || 'Form submitted successfully!';
};

/**
 * Analytics tracking for form events
 * Integrated with existing analytics but ensures no PII is tracked
 */
export const trackFormEvent = (
  event: 'form_start' | 'form_submit' | 'form_success' | 'form_error',
  formType: string,
  additionalData?: Record<string, any>
) => {
  // Ensure no PII is included in tracking
  const cleanData = {
    form_type: formType,
    timestamp: Date.now(),
    ...additionalData
  };

  // Remove any potentially sensitive fields
  delete cleanData.email;
  delete cleanData.name;
  delete cleanData.firstName;
  delete cleanData.lastName;
  delete cleanData.phone;
  delete cleanData.company;
  
  // Track event (implementation would depend on analytics provider)
  console.log(`Form Analytics: ${event}`, cleanData);
  
  // In production, this would integrate with Google Analytics, Mixpanel, etc.
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      event_category: 'form_interaction',
      event_label: formType,
      custom_parameters: cleanData
    });
  }
};

/**
 * Auto-save form data to localStorage for long forms
 */
export const useFormAutoSave = (
  formType: string,
  data: any,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
    excludeFields?: string[];
  }
) => {
  const {
    enabled = true,
    debounceMs = 1000,
    excludeFields = ['password', 'confirmPassword', '_website']
  } = options || {};

  if (!enabled || typeof window === 'undefined') return;

  const storageKey = `ttt-form-${formType}`;
  
  // Debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Save function
  const saveData = debounce((dataToSave: any) => {
    try {
      // Remove excluded fields
      const cleanData = { ...dataToSave };
      excludeFields.forEach(field => delete cleanData[field]);
      
      localStorage.setItem(storageKey, JSON.stringify({
        data: cleanData,
        timestamp: Date.now(),
        version: '1.0'
      }));
    } catch (error) {
      console.warn('Failed to auto-save form data:', error);
    }
  }, debounceMs);

  // Save current data
  saveData(data);
};

/**
 * Restore auto-saved form data
 */
export const restoreFormData = (formType: string): any => {
  if (typeof window === 'undefined') return null;

  const storageKey = `ttt-form-${formType}`;
  
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    const age = Date.now() - parsed.timestamp;
    
    // Only restore if data is less than 24 hours old
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(storageKey);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.warn('Failed to restore form data:', error);
    return null;
  }
};

/**
 * Clear auto-saved form data
 */
export const clearFormData = (formType: string): void => {
  if (typeof window === 'undefined') return;

  const storageKey = `ttt-form-${formType}`;
  localStorage.removeItem(storageKey);
};