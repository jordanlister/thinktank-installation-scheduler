/**
 * Think Tank Technologies - Free Trial Signup Form
 * Account creation workflow with minimal friction and progressive profiling
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Zap, 
  User, 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

// UI Components
import { Input, Select, Checkbox } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

// Form schemas and utilities
import { 
  trialSignupSchema, 
  type TrialSignupData,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS
} from '../../../lib/forms/schemas';
import { 
  submitForm, 
  trackFormEvent,
  type FormResponse 
} from '../../../lib/forms/utils';

interface TrialSignupFormProps {
  onSuccess?: (data: TrialSignupData) => void;
  className?: string;
  source?: string;
  prefilledEmail?: string;
}

interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  showPassword: boolean;
  showConfirmPassword: boolean;
  step: 'account' | 'company' | 'complete';
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

const TRIAL_FEATURES = [
  'Full access to all features for 14 days',
  'Up to 5 technicians included',
  'Unlimited installations and scheduling',
  'Route optimization and analytics',
  'Email and chat support',
  'No credit card required'
];

const SECURITY_FEATURES = [
  { icon: <Shield className="w-4 h-4" />, text: 'Enterprise-grade security' },
  { icon: <Clock className="w-4 h-4" />, text: '14-day free trial' },
  { icon: <Star className="w-4 h-4" />, text: 'No credit card required' }
];

export const TrialSignupForm: React.FC<TrialSignupFormProps> = ({
  onSuccess,
  className = '',
  source = 'unknown',
  prefilledEmail = ''
}) => {
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    showPassword: false,
    showConfirmPassword: false,
    step: 'account'
  });

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
    setValue,
    getValues
  } = useForm<TrialSignupData>({
    resolver: zodResolver(trialSignupSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: prefilledEmail,
      password: '',
      confirmPassword: '',
      company: '',
      phone: '',
      industry: undefined,
      teamSize: undefined,
      monthlyInstallations: undefined,
      terms: false,
      privacy: false,
      marketing: false,
      _website: ''
    }
  });

  // Watch password for strength indicator
  const watchedPassword = watch('password');
  const watchedEmail = watch('email');

  // Track form start
  useEffect(() => {
    trackFormEvent('form_start', 'trial_signup', { source });
  }, [source]);

  /**
   * Calculate password strength
   */
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    return {
      score,
      feedback,
      isValid: score >= 3
    };
  };

  const passwordStrength = calculatePasswordStrength(watchedPassword || '');

  /**
   * Get password strength color
   */
  const getPasswordStrengthColor = (): string => {
    if (passwordStrength.score <= 1) return 'bg-error';
    if (passwordStrength.score <= 2) return 'bg-warning';
    if (passwordStrength.score <= 3) return 'bg-brand-accent';
    return 'bg-success';
  };

  /**
   * Get password strength label
   */
  const getPasswordStrengthLabel = (): string => {
    if (passwordStrength.score <= 1) return 'Weak';
    if (passwordStrength.score <= 2) return 'Fair';
    if (passwordStrength.score <= 3) return 'Good';
    return 'Strong';
  };

  /**
   * Proceed to company information step
   */
  const proceedToCompanyStep = async () => {
    const isValid = await trigger(['firstName', 'lastName', 'email', 'password', 'confirmPassword']);
    if (isValid) {
      setFormState(prev => ({ ...prev, step: 'company' }));
      trackFormEvent('trial_signup_step_completed', 'trial_signup', { 
        step: 'account', 
        source 
      });
    }
  };

  /**
   * Go back to account step
   */
  const backToAccountStep = () => {
    setFormState(prev => ({ ...prev, step: 'account' }));
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: TrialSignupData) => {
    if (formState.isSubmitting) return;

    setFormState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      error: null 
    }));

    try {
      trackFormEvent('form_submit', 'trial_signup', {
        source,
        industry: data.industry,
        team_size: data.teamSize,
        has_phone: !!data.phone,
        monthly_installations: data.monthlyInstallations,
        marketing_consent: data.marketing
      });

      const response: FormResponse = await submitForm(data, 'trial');

      if (response.ok) {
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          isSuccess: true,
          step: 'complete'
        }));

        trackFormEvent('form_success', 'trial_signup', { source });
        onSuccess?.(data);

      } else {
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          error: response.message 
        }));

        trackFormEvent('form_error', 'trial_signup', { source });
      }
    } catch (error) {
      console.error('Trial signup error:', error);
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }));

      trackFormEvent('form_error', 'trial_signup', { source });
    }
  };

  // Success state
  if (formState.isSuccess) {
    return (
      <Card className={`p-8 bg-success/10 border-success/20 ${className}`}>
        <div className="text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-success" />
          </div>
          <h3 className="text-2xl font-semibold text-success mb-4">
            Welcome to Think Tank Technologies!
          </h3>
          <p className="text-text-secondary mb-6">
            Your free trial account has been created successfully. 
            Check your email for login instructions and getting started guide.
          </p>
          
          <div className="bg-surface/50 rounded-lg p-6 text-left mb-6">
            <h4 className="font-semibold text-white mb-4">Your 14-Day Free Trial Includes:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRIAL_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="primary" size="lg" className="flex-1">
              Access Your Dashboard
            </Button>
            <Button variant="secondary" size="lg" className="flex-1">
              Download Mobile App
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-brand-primary" />
          <span className="text-brand-primary font-medium">Free Trial</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Start Your Free Trial
        </h2>
        <p className="text-text-secondary">
          Get started with Think Tank Technologies in under 2 minutes. 
          No credit card required, cancel anytime.
        </p>
      </div>

      {/* Security Features */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-6 text-sm text-text-muted">
          {SECURITY_FEATURES.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              {feature.icon}
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {formState.error && (
            <Card className="p-4 bg-error/10 border-error/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-error mt-0.5" />
                <div>
                  <p className="text-error font-medium">Signup Failed</p>
                  <p className="text-sm text-error/80 mt-1">{formState.error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 1: Account Creation */}
          {formState.step === 'account' && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-brand-primary" />
                <h3 className="text-lg font-semibold text-white">Create Your Account</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    {...register('firstName')}
                    error={!!errors.firstName}
                    errorMessage={errors.firstName?.message}
                    required
                    disabled={formState.isSubmitting}
                  />
                  
                  <Input
                    label="Last Name"
                    {...register('lastName')}
                    error={!!errors.lastName}
                    errorMessage={errors.lastName?.message}
                    required
                    disabled={formState.isSubmitting}
                  />
                </div>
                
                <Input
                  label="Email Address"
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  errorMessage={errors.email?.message}
                  required
                  disabled={formState.isSubmitting}
                  helperText="This will be your login email"
                />
                
                <div className="relative">
                  <Input
                    label="Password"
                    type={formState.showPassword ? 'text' : 'password'}
                    {...register('password')}
                    error={!!errors.password}
                    errorMessage={errors.password?.message}
                    required
                    disabled={formState.isSubmitting}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setFormState(prev => ({ 
                          ...prev, 
                          showPassword: !prev.showPassword 
                        }))}
                        className="text-text-muted hover:text-white"
                      >
                        {formState.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  
                  {/* Password Strength Indicator */}
                  {watchedPassword && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score <= 1 ? 'text-error' :
                          passwordStrength.score <= 2 ? 'text-warning' :
                          passwordStrength.score <= 3 ? 'text-brand-accent' :
                          'text-success'
                        }`}>
                          {getPasswordStrengthLabel()}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-text-muted">
                          Improve: {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Input
                  label="Confirm Password"
                  type={formState.showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  error={!!errors.confirmPassword}
                  errorMessage={errors.confirmPassword?.message}
                  required
                  disabled={formState.isSubmitting}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setFormState(prev => ({ 
                        ...prev, 
                        showConfirmPassword: !prev.showConfirmPassword 
                      }))}
                      className="text-text-muted hover:text-white"
                    >
                      {formState.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
              
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full mt-6"
                onClick={proceedToCompanyStep}
                disabled={!passwordStrength.isValid || !watchedEmail}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          )}

          {/* Step 2: Company Information */}
          {formState.step === 'company' && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-brand-primary" />
                <h3 className="text-lg font-semibold text-white">Company Information</h3>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  {...register('company')}
                  error={!!errors.company}
                  errorMessage={errors.company?.message}
                  required
                  disabled={formState.isSubmitting}
                />
                
                <Input
                  label="Phone Number"
                  type="tel"
                  {...register('phone')}
                  error={!!errors.phone}
                  errorMessage={errors.phone?.message}
                  required
                  disabled={formState.isSubmitting}
                />
                
                <Select
                  options={INDUSTRY_OPTIONS}
                  placeholder="Select your industry"
                  {...register('industry')}
                  error={!!errors.industry}
                />
                
                <Select
                  options={TEAM_SIZE_OPTIONS}
                  placeholder="Select team size"
                  {...register('teamSize')}
                  error={!!errors.teamSize}
                />
                
                <Input
                  label="Monthly Installations (Optional)"
                  type="number"
                  {...register('monthlyInstallations', { valueAsNumber: true })}
                  error={!!errors.monthlyInstallations}
                  errorMessage={errors.monthlyInstallations?.message}
                  min={1}
                  placeholder="e.g., 100"
                  helperText="Helps us customize your experience"
                  disabled={formState.isSubmitting}
                />
              </div>
              
              {/* Terms and Conditions */}
              <div className="space-y-4 mt-6 pt-6 border-t border-border">
                <Checkbox
                  {...register('terms')}
                  error={!!errors.terms}
                  errorMessage={errors.terms?.message}
                  label={
                    <>I agree to the <a href="/terms" className="text-brand-primary hover:underline">Terms of Service</a></>
                  }
                  required
                  disabled={formState.isSubmitting}
                />
                
                <Checkbox
                  {...register('privacy')}
                  error={!!errors.privacy}
                  errorMessage={errors.privacy?.message}
                  label={
                    <>I agree to the <a href="/privacy" className="text-brand-primary hover:underline">Privacy Policy</a></>
                  }
                  required
                  disabled={formState.isSubmitting}
                />
                
                <Checkbox
                  {...register('marketing')}
                  label="Send me updates about new features and industry insights"
                  disabled={formState.isSubmitting}
                />
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={backToAccountStep}
                  disabled={formState.isSubmitting}
                  className="flex-1"
                >
                  Back
                </Button>
                
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={formState.isSubmitting || !isValid}
                  className="flex-1"
                >
                  {formState.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Start Free Trial
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Honeypot Field */}
          <input
            type="text"
            {...register('_website')}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />
        </form>

        {/* Footer Note */}
        <div className="text-center mt-6 text-xs text-text-muted">
          <p>
            By signing up, you agree to receive emails from Think Tank Technologies. 
            You can unsubscribe at any time.
          </p>
          <p className="mt-2">
            Already have an account?{' '}
            <a href="/login" className="text-brand-primary hover:underline">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};