// Think Tank Technologies - Secure Contact Form Implementation

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { 
  validateFormData, 
  createFormValidator,
  FormSubmissionData 
} from '../../../lib/security/validation';
import { 
  checkRateLimit, 
  checkSpam,
  securityCheck 
} from '../../../lib/security/rateLimit';
import {
  logSecurityEvent,
  securityMonitor
} from '../../../lib/security/monitoring';
import { 
  SecurityEventType, 
  SecuritySeverity 
} from '../../../lib/security/types';
import { generateNonce, hashData } from '../../../lib/security/encryption';
import { Mail, Send, Shield, AlertTriangle } from 'lucide-react';

interface SecureContactFormProps {
  onSubmit?: (data: any) => Promise<void>;
  className?: string;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  consent: boolean;
}

interface FormStatus {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  rateLimited: boolean;
  spamDetected: boolean;
}

export const SecureContactForm: React.FC<SecureContactFormProps> = ({
  onSubmit,
  className = ''
}) => {
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    consent: false
  });

  const [formStatus, setFormStatus] = useState<FormStatus>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    rateLimited: false,
    spamDetected: false
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [sessionData, setSessionData] = useState<{
    nonce: string;
    timestamp: number;
    fingerprint: string;
  }>({
    nonce: '',
    timestamp: 0,
    fingerprint: ''
  });

  // Initialize form security on mount
  useEffect(() => {
    initializeFormSecurity();
  }, []);

  /**
   * Initialize security measures for the form
   */
  const initializeFormSecurity = async () => {
    const nonce = generateNonce();
    const timestamp = Date.now();
    const fingerprint = await generateFingerprint();
    
    setSessionData({ nonce, timestamp, fingerprint });
    
    // Log form initialization
    logSecurityEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecuritySeverity.LOW,
      'Secure contact form initialized',
      { nonce, fingerprint },
      {
        ip: await getClientIP(),
        userAgent: navigator.userAgent,
        endpoint: '/contact'
      }
    );
  };

  /**
   * Generates a device/browser fingerprint
   */
  const generateFingerprint = async (): Promise<string> => {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.cookieEnabled,
      navigator.doNotTrack || 'unknown'
    ];

    const fingerprint = await hashData(components.join('|'));
    return fingerprint.substring(0, 16);
  };

  /**
   * Gets client IP (placeholder - would be implemented server-side)
   */
  const getClientIP = async (): Promise<string> => {
    // In a real implementation, this would be handled server-side
    return 'client-ip';
  };

  /**
   * Handles input changes with real-time validation
   */
  const handleInputChange = (field: keyof FormState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for certain fields
    if (field === 'email' && typeof value === 'string' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }
    
    // Log suspicious activity
    if (typeof value === 'string' && value.length > 1000) {
      logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecuritySeverity.MEDIUM,
        'Unusually long input detected',
        { field, length: value.length },
        {
          ip: sessionData.fingerprint,
          endpoint: '/contact'
        }
      );
    }
  };

  /**
   * Validates form data before submission
   */
  const validateForm = async (): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
    const validator = createFormValidator('contact');
    
    // Prepare form data with security metadata
    const formData: FormSubmissionData = {
      ...formState,
      _nonce: sessionData.nonce,
      _timestamp: sessionData.timestamp,
      _fingerprint: sessionData.fingerprint,
      _userAgent: navigator.userAgent,
      _referrer: document.referrer,
      _website: '', // Honeypot field - should remain empty
    };

    const validation = validator(formData);
    
    if (!validation.isValid) {
      // Log validation failures
      if (validation.threats.length > 0) {
        logSecurityEvent(
          SecurityEventType.MALICIOUS_PAYLOAD,
          SecuritySeverity.HIGH,
          'Malicious content detected in form submission',
          { threats: validation.threats },
          {
            ip: sessionData.fingerprint,
            userAgent: navigator.userAgent,
            endpoint: '/contact'
          }
        );
      }
    }

    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  };

  /**
   * Performs security checks before form submission
   */
  const performSecurityChecks = async (): Promise<{ allowed: boolean; reason?: string }> => {
    const ip = sessionData.fingerprint;
    const userAgent = navigator.userAgent;
    const endpoint = '/contact';

    // Comprehensive security check
    const securityResult = securityCheck(
      { ...formState, _timestamp: sessionData.timestamp },
      ip,
      endpoint,
      userAgent
    );

    if (!securityResult.allowed) {
      // Log blocked submission
      logSecurityEvent(
        SecurityEventType.SPAM_ATTEMPT,
        SecuritySeverity.HIGH,
        'Form submission blocked by security checks',
        {
          reasons: securityResult.blockedReasons,
          rateLimit: securityResult.rateLimit,
          spamCheck: securityResult.spamCheck
        },
        { ip, userAgent, endpoint }
      );

      return {
        allowed: false,
        reason: securityResult.blockedReasons.join(', ')
      };
    }

    return { allowed: true };
  };

  /**
   * Handles form submission with comprehensive security
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formStatus.isSubmitting) return;

    setFormStatus(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Validate consent
      if (!formState.consent) {
        setFormErrors({ consent: 'Please accept our privacy policy to continue' });
        setFormStatus(prev => ({ ...prev, isSubmitting: false }));
        return;
      }

      // Validate form data
      const validation = await validateForm();
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        setFormStatus(prev => ({ ...prev, isSubmitting: false }));
        return;
      }

      // Perform security checks
      const securityResult = await performSecurityChecks();
      if (!securityResult.allowed) {
        setFormStatus(prev => ({
          ...prev,
          isSubmitting: false,
          error: 'Your submission has been flagged by our security systems. Please try again or contact support.',
          rateLimited: securityResult.reason?.includes('rate limit') || false,
          spamDetected: securityResult.reason?.includes('spam') || false
        }));
        return;
      }

      // Prepare secure submission data
      const submissionData = {
        name: formState.name.trim(),
        email: formState.email.trim().toLowerCase(),
        company: formState.company.trim(),
        phone: formState.phone.trim(),
        message: formState.message.trim(),
        timestamp: Date.now(),
        sessionNonce: sessionData.nonce
      };

      // Submit form (would be handled by actual submission logic)
      if (onSubmit) {
        await onSubmit(submissionData);
      } else {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Log successful submission
      logSecurityEvent(
        SecurityEventType.UNAUTHORIZED_ACCESS,
        SecuritySeverity.LOW,
        'Contact form submitted successfully',
        { email: formState.email },
        {
          ip: sessionData.fingerprint,
          userAgent: navigator.userAgent,
          endpoint: '/contact'
        }
      );

      setFormStatus(prev => ({ ...prev, isSuccess: true, isSubmitting: false }));
      
      // Reset form
      setFormState({
        name: '',
        email: '',
        company: '',
        phone: '',
        message: '',
        consent: false
      });

    } catch (error) {
      console.error('Form submission error:', error);
      
      logSecurityEvent(
        SecurityEventType.UNAUTHORIZED_ACCESS,
        SecuritySeverity.MEDIUM,
        'Contact form submission failed',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        {
          ip: sessionData.fingerprint,
          endpoint: '/contact'
        }
      );

      setFormStatus(prev => ({
        ...prev,
        isSubmitting: false,
        error: 'An error occurred while submitting your message. Please try again.'
      }));
    }
  };

  // Success state
  if (formStatus.isSuccess) {
    return (
      <div className={`p-8 bg-green-50 border border-green-200 rounded-xl ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">Message Sent Successfully!</h3>
          <p className="text-green-700">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Security Status Indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Shield className="w-4 h-4 text-green-600" />
        <span>Secure form with anti-spam protection</span>
      </div>

      {/* Error Messages */}
      {formStatus.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800">{formStatus.error}</p>
            {formStatus.rateLimited && (
              <p className="text-sm text-red-600 mt-1">
                Please wait before submitting another request.
              </p>
            )}
            {formStatus.spamDetected && (
              <p className="text-sm text-red-600 mt-1">
                Your message was flagged as potential spam. Please review your content.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Full Name *"
            type="text"
            value={formState.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={formErrors.name}
            maxLength={100}
            required
          />
        </div>
        
        <div>
          <Input
            label="Email Address *"
            type="email"
            value={formState.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={formErrors.email}
            maxLength={254}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Company Name"
            type="text"
            value={formState.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            error={formErrors.company}
            maxLength={100}
          />
        </div>
        
        <div>
          <Input
            label="Phone Number"
            type="tel"
            value={formState.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={formErrors.phone}
            maxLength={20}
          />
        </div>
      </div>

      <div>
        <Input
          label="Message *"
          type="textarea"
          value={formState.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          error={formErrors.message}
          maxLength={5000}
          rows={4}
          required
        />
      </div>

      {/* Honeypot Field (hidden) */}
      <input
        type="text"
        name="_website"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Consent Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="consent"
          checked={formState.consent}
          onChange={(e) => handleInputChange('consent', e.target.checked)}
          className="mt-1"
          required
        />
        <label htmlFor="consent" className="text-sm text-gray-700">
          I agree to the{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>{' '}
          and consent to Think Tank Technologies contacting me about their services. *
        </label>
        {formErrors.consent && (
          <p className="text-red-600 text-sm mt-1">{formErrors.consent}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={formStatus.isSubmitting}
        className="w-full md:w-auto"
      >
        {formStatus.isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Sending Message...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </>
        )}
      </Button>

      {/* Security Notice */}
      <p className="text-xs text-gray-500">
        This form is protected by advanced security measures including rate limiting, 
        spam detection, and input validation to ensure the safety of your data.
      </p>
    </form>
  );
};