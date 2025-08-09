/**
 * Lead Route - Newsletter Signup Form
 * Simple email capture form optimized for maximum conversion
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Sparkles,
  TrendingUp,
  FileText,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

// UI Components
import { Input, Checkbox } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

// Form schemas and utilities
import { 
  newsletterSchema, 
  type NewsletterData,
  NEWSLETTER_INTERESTS
} from '../../../lib/forms/schemas';
import { 
  submitForm, 
  trackFormEvent,
  type FormResponse 
} from '../../../lib/forms/utils';

interface NewsletterSignupProps {
  onSuccess?: (data: NewsletterData) => void;
  className?: string;
  variant?: 'inline' | 'card' | 'modal' | 'footer';
  showInterests?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
}

interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}

const NEWSLETTER_BENEFITS = [
  {
    icon: <TrendingUp className="w-5 h-5 text-brand-primary" />,
    title: 'Industry Insights',
    description: 'Latest trends in field service management'
  },
  {
    icon: <FileText className="w-5 h-5 text-success" />,
    title: 'Case Studies',
    description: 'Real success stories from our customers'
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-brand-accent" />,
    title: 'Best Practices',
    description: 'Proven strategies to optimize operations'
  },
  {
    icon: <Calendar className="w-5 h-5 text-warning" />,
    title: 'Webinars & Events',
    description: 'Exclusive invitations to educational content'
  }
];

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  onSuccess,
  className = '',
  variant = 'card',
  showInterests = false,
  title,
  description,
  placeholder = 'Enter your email address'
}) => {
  // Form state management
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    error: null
  });

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<NewsletterData>({
    resolver: zodResolver(newsletterSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      firstName: '',
      interests: [],
      consent: false,
      _website: ''
    }
  });

  // Track form start
  useEffect(() => {
    trackFormEvent('form_start', 'newsletter', { variant });
  }, [variant]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: NewsletterData) => {
    if (formState.isSubmitting) return;

    setFormState({ isSubmitting: true, isSuccess: false, error: null });

    try {
      trackFormEvent('form_submit', 'newsletter', {
        variant,
        has_name: !!data.firstName,
        interests_count: data.interests?.length || 0
      });

      const response: FormResponse = await submitForm(data, 'newsletter');

      if (response.ok) {
        setFormState({ 
          isSubmitting: false, 
          isSuccess: true, 
          error: null 
        });

        trackFormEvent('form_success', 'newsletter', { variant });
        onSuccess?.(data);

        // Reset form after delay for inline variants
        if (variant === 'inline') {
          setTimeout(() => {
            reset();
            setFormState({
              isSubmitting: false,
              isSuccess: false,
              error: null
            });
          }, 3000);
        }

      } else {
        setFormState({ 
          isSubmitting: false, 
          isSuccess: false, 
          error: response.message 
        });

        trackFormEvent('form_error', 'newsletter', {
          variant,
          error_type: 'submission_failed'
        });
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      
      setFormState({ 
        isSubmitting: false, 
        isSuccess: false, 
        error: 'An unexpected error occurred. Please try again.' 
      });

      trackFormEvent('form_error', 'newsletter', {
        variant,
        error_type: 'exception'
      });
    }
  };

  // Get component styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'inline':
        return 'bg-transparent';
      case 'modal':
        return 'bg-transparent';
      case 'footer':
        return 'bg-surface/30 backdrop-blur-sm';
      case 'card':
      default:
        return 'bg-surface/50 backdrop-blur-sm border border-border';
    }
  };

  // Success state for card and modal variants
  if (formState.isSuccess && ['card', 'modal'].includes(variant)) {
    return (
      <Card className={`p-6 bg-success/10 border-success/20 ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-success mb-2">
            Welcome to our newsletter!
          </h3>
          <p className="text-text-secondary text-sm">
            Check your email for a confirmation link to complete your subscription.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`${getVariantStyles()} rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        {formState.isSuccess && variant === 'inline' ? (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Successfully subscribed!</span>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              {variant !== 'footer' && <Sparkles className="w-5 h-5 text-brand-primary" />}
              {title || 'Stay Updated'}
            </h3>
            <p className="text-text-secondary text-sm">
              {description || 'Get the latest insights on field service management, case studies, and industry best practices delivered to your inbox.'}
            </p>
          </>
        )}
      </div>

      {!formState.isSuccess && (
        <>
          {/* Benefits (for card variant) */}
          {variant === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {NEWSLETTER_BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  {benefit.icon}
                  <div>
                    <div className="font-medium text-white text-sm">{benefit.title}</div>
                    <div className="text-text-muted text-xs">{benefit.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Message */}
            {formState.error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                  <p className="text-error text-sm">{formState.error}</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className={variant === 'inline' ? 'flex gap-3' : 'space-y-4'}>
              {/* First Name (optional for card variant) */}
              {(variant === 'card' || showInterests) && (
                <Input
                  label={variant === 'inline' ? undefined : "First Name"}
                  placeholder="Your name (optional)"
                  {...register('firstName')}
                  error={!!errors.firstName}
                  errorMessage={errors.firstName?.message}
                  disabled={formState.isSubmitting}
                  size={variant === 'inline' ? 'sm' : 'md'}
                />
              )}

              {/* Email Field */}
              <div className={variant === 'inline' ? 'flex-1' : ''}>
                <Input
                  label={variant === 'inline' ? undefined : "Email Address"}
                  type="email"
                  placeholder={placeholder}
                  {...register('email')}
                  error={!!errors.email}
                  errorMessage={errors.email?.message}
                  required
                  disabled={formState.isSubmitting}
                  size={variant === 'inline' ? 'sm' : 'md'}
                />
              </div>

              {/* Submit Button */}
              {variant === 'inline' && (
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={formState.isSubmitting || !isValid}
                  className="flex-shrink-0"
                >
                  {formState.isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Interests (for expanded variants) */}
            {showInterests && !['inline'].includes(variant) && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  What interests you most? (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {NEWSLETTER_INTERESTS.map((interest) => (
                    <Checkbox
                      key={interest.value}
                      {...register('interests')}
                      value={interest.value}
                      label={interest.label}
                      disabled={formState.isSubmitting}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Consent Checkbox */}
            <Checkbox
              {...register('consent')}
              error={!!errors.consent}
              errorMessage={errors.consent?.message}
              label="I agree to receive newsletters and can unsubscribe at any time."
              required
              disabled={formState.isSubmitting}
            />

            {/* Honeypot Field */}
            <input
              type="text"
              {...register('_website')}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Submit Button (for non-inline variants) */}
            {variant !== 'inline' && (
              <Button
                type="submit"
                variant="primary"
                size={variant === 'modal' ? 'md' : 'lg'}
                disabled={formState.isSubmitting || !isValid}
                className="w-full"
              >
                {formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Subscribe to Newsletter
                  </>
                )}
              </Button>
            )}

            {/* Footer Note */}
            {variant === 'card' && (
              <div className="text-xs text-text-muted pt-4 border-t border-border">
                <p className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Join 2,500+ field service professionals. Unsubscribe anytime.
                </p>
              </div>
            )}
          </form>
        </>
      )}

      {/* Success Message for inline variant */}
      {formState.isSuccess && variant === 'inline' && (
        <div className="mt-2 text-sm text-success">
          Check your email to confirm your subscription.
        </div>
      )}
    </div>
  );
};