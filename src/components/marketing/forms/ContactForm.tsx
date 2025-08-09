/**
 * Lead Route - Enhanced Contact Form
 * React Hook Form + Zod validation with comprehensive security integration
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Send, Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

// UI Components
import { Input, Textarea, Checkbox } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

// Form schemas and utilities
import { contactFormSchema, type ContactFormData } from '../../../lib/forms/schemas';
import { 
  submitForm, 
  trackFormEvent, 
  useFormAutoSave, 
  restoreFormData, 
  clearFormData,
  type FormResponse 
} from '../../../lib/forms/utils';

interface ContactFormProps {
  onSuccess?: (data: ContactFormData) => void;
  className?: string;
  showTitle?: boolean;
  variant?: 'default' | 'compact' | 'inline';
}

interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  progress: number;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  onSuccess,
  className = '',
  showTitle = true,
  variant = 'default'
}) => {
  // Form state management
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    progress: 0
  });

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, touchedFields },
    reset,
    setValue,
    getValues
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
      message: '',
      consent: false,
      _website: '' // Honeypot field
    }
  });

  // Watch form values for auto-save
  const formValues = watch();

  // Auto-save functionality for long forms
  useFormAutoSave('contact', formValues, {
    enabled: variant === 'default', // Only for full contact forms
    debounceMs: 2000
  });

  // Restore saved data on component mount
  useEffect(() => {
    const savedData = restoreFormData('contact');
    if (savedData && variant === 'default') {
      Object.entries(savedData).forEach(([key, value]) => {
        setValue(key as keyof ContactFormData, value);
      });
    }
  }, [setValue, variant]);

  // Track form start
  useEffect(() => {
    trackFormEvent('form_start', 'contact', { variant });
  }, [variant]);

  /**
   * Handle form submission with comprehensive error handling
   */
  const onSubmit = async (data: ContactFormData) => {
    if (formState.isSubmitting) return;

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null, progress: 0 }));

    try {
      // Track submission attempt
      trackFormEvent('form_submit', 'contact', { 
        variant,
        has_company: !!data.company,
        has_phone: !!data.phone
      });

      // Submit form with progress tracking
      const response: FormResponse = await submitForm(data, 'contact', {
        onProgress: (progress) => {
          setFormState(prev => ({ ...prev, progress }));
        }
      });

      if (response.ok) {
        // Success state
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          isSuccess: true,
          progress: 100 
        }));

        // Track successful submission
        trackFormEvent('form_success', 'contact', { variant });

        // Clear auto-saved data
        clearFormData('contact');

        // Call success callback
        onSuccess?.(data);

        // Reset form after delay
        setTimeout(() => {
          reset();
          setFormState({
            isSubmitting: false,
            isSuccess: false,
            error: null,
            progress: 0
          });
        }, 5000);

      } else {
        // Handle submission errors
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          error: response.message,
          progress: 0 
        }));

        // Track form error
        trackFormEvent('form_error', 'contact', { 
          variant,
          error_type: 'submission_failed',
          has_field_errors: !!response.fieldErrors
        });

        // Handle field-specific errors
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, message]) => {
            if (field !== '_general') {
              // Set field errors (React Hook Form doesn't have a direct way to set server errors)
              console.warn(`Server error for ${field}: ${message}`);
            }
          });
        }
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: 'An unexpected error occurred. Please try again.',
        progress: 0 
      }));

      trackFormEvent('form_error', 'contact', { 
        variant,
        error_type: 'exception',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Success state component
  if (formState.isSuccess) {
    return (
      <Card className={`p-8 bg-success/10 border-success/20 ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-success mb-2">
            Message Sent Successfully!
          </h3>
          <p className="text-text-secondary mb-6">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
          {variant === 'default' && (
            <div className="text-sm text-text-muted">
              <p>What happens next?</p>
              <ul className="mt-2 space-y-1">
                <li>• Our team will review your inquiry</li>
                <li>• We'll respond within 24 hours</li>
                <li>• If needed, we'll schedule a call to discuss your needs</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-success" />
            <span className="text-sm text-text-muted">Secure contact form</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Get in Touch
          </h2>
          <p className="text-text-secondary">
            Ready to transform your field service operations? Let's discuss your needs.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Message */}
        {formState.error && (
          <Card className="p-4 bg-error/10 border-error/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-error font-medium">Submission Failed</p>
                <p className="text-sm text-error/80 mt-1">{formState.error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Progress Bar */}
        {formState.isSubmitting && (
          <div className="w-full bg-surface rounded-full h-2">
            <div 
              className="bg-brand-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${formState.progress}%` }}
            />
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <Input
            label="Full Name"
            type="text"
            {...register('name')}
            error={!!errors.name}
            errorMessage={errors.name?.message}
            required
            disabled={formState.isSubmitting}
            maxLength={50}
          />

          {/* Email Field */}
          <Input
            label="Email Address"
            type="email"
            {...register('email')}
            error={!!errors.email}
            errorMessage={errors.email?.message}
            required
            disabled={formState.isSubmitting}
            maxLength={254}
          />
        </div>

        {variant === 'default' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Field */}
            <Input
              label="Company Name"
              type="text"
              {...register('company')}
              error={!!errors.company}
              errorMessage={errors.company?.message}
              disabled={formState.isSubmitting}
              maxLength={100}
              helperText="Optional - helps us understand your needs"
            />

            {/* Phone Field */}
            <Input
              label="Phone Number"
              type="tel"
              {...register('phone')}
              error={!!errors.phone}
              errorMessage={errors.phone?.message}
              disabled={formState.isSubmitting}
              maxLength={20}
              helperText="Optional - for urgent inquiries"
            />
          </div>
        )}

        {/* Message Field */}
        <Textarea
          label="Message"
          {...register('message')}
          error={!!errors.message}
          errorMessage={errors.message?.message}
          required
          disabled={formState.isSubmitting}
          maxLength={5000}
          rows={variant === 'compact' ? 3 : 5}
          helperText={
            variant === 'default'
              ? "Tell us about your current challenges and what you're looking for"
              : undefined
          }
        />

        {/* Honeypot Field (hidden) */}
        <input
          type="text"
          {...register('_website')}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Consent Checkbox */}
        <Checkbox
          {...register('consent')}
          error={!!errors.consent}
          errorMessage={errors.consent?.message}
          label="I agree to the Privacy Policy and consent to Lead Route contacting me about their services."
          required
          disabled={formState.isSubmitting}
        />

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Button
            type="submit"
            variant="primary"
            size={variant === 'compact' ? 'md' : 'lg'}
            disabled={formState.isSubmitting || !isValid}
            className="min-w-[200px]"
          >
            {formState.isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>

          {variant === 'default' && (
            <div className="text-sm text-text-muted sm:mt-2">
              <p>✓ Secure submission with anti-spam protection</p>
              <p>✓ We respond within 24 hours</p>
              <p>✓ No spam, ever</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-xs text-text-muted border-t border-border pt-4">
          <p className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            This form is protected by advanced security measures including rate limiting,
            spam detection, and input validation to ensure the safety of your data.
          </p>
        </div>
      </form>
    </div>
  );
};